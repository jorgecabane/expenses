import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseLocalDate } from '@/lib/utils'

// DELETE - Eliminar un ingreso
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ incomeId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { incomeId } = await params

    // Buscar el ingreso
    const income = await prisma.income.findUnique({
      where: { id: incomeId },
      select: {
        id: true,
        createdBy: true,
      },
    })

    if (!income) {
      return NextResponse.json({ error: 'Ingreso no encontrado' }, { status: 404 })
    }

    // Verificar que el usuario sea el creador del ingreso
    if (income.createdBy !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar este ingreso' },
        { status: 403 }
      )
    }

    // Eliminar el ingreso
    await prisma.income.delete({
      where: { id: incomeId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting income:', error)
    return NextResponse.json(
      { error: 'Error al eliminar ingreso' },
      { status: 500 }
    )
  }
}

// PATCH - Actualizar un ingreso
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ incomeId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { incomeId } = await params
    const body = await request.json()
    const { amount, description, date, recurringConfig, isRecurring } = body

    // Buscar el ingreso
    const income = await prisma.income.findUnique({
      where: { id: incomeId },
    })

    if (!income) {
      return NextResponse.json({ error: 'Ingreso no encontrado' }, { status: 404 })
    }

    // Verificar que el usuario sea el creador
    if (income.createdBy !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para editar este ingreso' },
        { status: 403 }
      )
    }

    // Actualizar
    const updatedIncome = await prisma.income.update({
      where: { id: incomeId },
      data: {
        ...(amount !== undefined && { amount }),
        ...(description !== undefined && { description }),
        ...(date !== undefined && { date: parseLocalDate(date) }),
        ...(isRecurring !== undefined && { isRecurring }),
        ...(recurringConfig !== undefined && { recurringConfig: recurringConfig as any }),
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ income: updatedIncome })
  } catch (error) {
    console.error('Error updating income:', error)
    return NextResponse.json(
      { error: 'Error al actualizar ingreso' },
      { status: 500 }
    )
  }
}
