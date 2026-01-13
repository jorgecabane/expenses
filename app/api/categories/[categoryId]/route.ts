import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, canUserEditCategory } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH - Actualizar categoría
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { categoryId } = await params

    const canEdit = await canUserEditCategory(user.id, categoryId)
    if (!canEdit) {
      return NextResponse.json(
        { error: 'No tienes permisos para editar esta categoría' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, icon, color, isPersonal, monthlyLimit } = body

    const updateData: {
      name?: string
      icon?: string | null
      color?: string | null
      isPersonal?: boolean
      monthlyLimit?: number | null
      ownerId?: string | null
    } = {}
    if (name !== undefined) updateData.name = name
    if (icon !== undefined) updateData.icon = icon
    if (color !== undefined) updateData.color = color
    if (monthlyLimit !== undefined) updateData.monthlyLimit = monthlyLimit
    if (isPersonal !== undefined) {
      updateData.isPersonal = isPersonal
      updateData.ownerId = isPersonal ? user.id : null
    }

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      { error: 'Error al actualizar categoría' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar categoría
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { categoryId } = await params

    const canEdit = await canUserEditCategory(user.id, categoryId)
    if (!canEdit) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar esta categoría' },
        { status: 403 }
      )
    }

    // Verificar si hay gastos asociados a esta categoría
    // Esto incluye tanto gastos normales como gastos recurrentes (templates)
    // Usar una transacción para asegurar que la verificación y eliminación sean atómicas
    const result = await prisma.$transaction(async (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => {
      // Primero verificar si existe la categoría
      const category = await tx.category.findUnique({
        where: { id: categoryId },
        select: { id: true },
      })

      if (!category) {
        throw new Error('Categoría no encontrada')
      }

      // Contar gastos asociados (incluyendo recurrentes)
      const expensesCount = await tx.expense.count({
        where: { 
          categoryId,
        },
      })

      // Log para debugging
      console.log(`[DELETE Category] categoryId: ${categoryId}, expensesCount: ${expensesCount}`)

      if (expensesCount > 0) {
        // Obtener detalles de los gastos para el mensaje
        const expenses = await tx.expense.findMany({
          where: { categoryId },
          select: {
            id: true,
            isRecurring: true,
            description: true,
            date: true,
          },
          take: 5, // Solo los primeros 5 para el mensaje
        })

        const recurringCount = expenses.filter((e: { isRecurring: boolean }) => e.isRecurring).length
        const regularCount = expenses.filter((e: { isRecurring: boolean }) => !e.isRecurring).length

        return {
          canDelete: false,
          expensesCount,
          message: `Este bolsillo tiene ${expensesCount} gasto${expensesCount > 1 ? 's' : ''} asociado${expensesCount > 1 ? 's' : ''} (${recurringCount} recurrente${recurringCount !== 1 ? 's' : ''}, ${regularCount} regular${regularCount !== 1 ? 'es' : ''})`,
        }
      }

      // Si no hay gastos, proceder con la eliminación
      await tx.category.delete({
        where: { id: categoryId },
      })

      return {
        canDelete: true,
        expensesCount: 0,
      }
    })

    // Si no se puede eliminar, retornar error
    if (!result.canDelete) {
      return NextResponse.json(
        { 
          error: 'No se puede eliminar un bolsillo que tiene gastos asociados',
          expensesCount: result.expensesCount,
          message: result.message,
        },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Error al eliminar categoría' },
      { status: 500 }
    )
  }
}
