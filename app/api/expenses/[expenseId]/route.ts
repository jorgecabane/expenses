import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE - Eliminar un gasto
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ expenseId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { expenseId } = await params

    // Buscar el gasto
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      select: {
        id: true,
        createdBy: true,
        category: true,
      },
    })

    if (!expense) {
      return NextResponse.json({ error: 'Gasto no encontrado' }, { status: 404 })
    }

    // Verificar que el usuario sea el creador del gasto
    if (expense.createdBy !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar este gasto' },
        { status: 403 }
      )
    }

    // Eliminar el gasto (y sus shares si existen)
    await prisma.expenseShare.deleteMany({
      where: { expenseId },
    })

    await prisma.expense.delete({
      where: { id: expenseId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting expense:', error)
    return NextResponse.json(
      { error: 'Error al eliminar gasto' },
      { status: 500 }
    )
  }
}

// GET - Obtener un gasto específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ expenseId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { expenseId } = await params

    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
      include: {
        category: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        expenseShares: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    if (!expense) {
      return NextResponse.json({ error: 'Gasto no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ expense })
  } catch (error) {
    console.error('Error fetching expense:', error)
    return NextResponse.json(
      { error: 'Error al obtener gasto' },
      { status: 500 }
    )
  }
}

// PATCH - Actualizar un gasto
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ expenseId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { expenseId } = await params
    const body = await request.json()
    const { amount, description, categoryId, date, recurringConfig, isRecurring } = body

    // Buscar el gasto
    const expense = await prisma.expense.findUnique({
      where: { id: expenseId },
    })

    if (!expense) {
      return NextResponse.json({ error: 'Gasto no encontrado' }, { status: 404 })
    }

    // Verificar que el usuario sea el creador
    if (expense.createdBy !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permisos para editar este gasto' },
        { status: 403 }
      )
    }

    // Actualizar
    const updatedExpense = await prisma.expense.update({
      where: { id: expenseId },
      data: {
        ...(amount !== undefined && { amount }),
        ...(description !== undefined && { description }),
        ...(categoryId !== undefined && { categoryId }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(isRecurring !== undefined && { isRecurring }),
        ...(recurringConfig !== undefined && { recurringConfig: recurringConfig as any }),
      },
      include: {
        category: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ expense: updatedExpense })
  } catch (error) {
    console.error('Error updating expense:', error)
    return NextResponse.json(
      { error: 'Error al actualizar gasto' },
      { status: 500 }
    )
  }
}
