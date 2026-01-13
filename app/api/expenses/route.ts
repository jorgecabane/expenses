import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, canUserAccessGroup, canUserEditCategory } from '@/lib/auth'
import { createExpense, getExpenses } from '@/lib/expenses'
import { prisma } from '@/lib/prisma'
import { parseLocalDate } from '@/lib/utils'

// GET - Obtener gastos
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')
    const categoryId = searchParams.get('categoryId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = searchParams.get('limit')

    if (!groupId) {
      return NextResponse.json(
        { error: 'groupId es requerido' },
        { status: 400 }
      )
    }

    const hasAccess = await canUserAccessGroup(user.id, groupId)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'No tienes acceso a este grupo' },
        { status: 403 }
      )
    }

    // Si no se especifican fechas, usar el mes actual
    let finalStartDate = startDate ? new Date(startDate) : undefined
    let finalEndDate = endDate ? new Date(endDate) : undefined
    
    if (!finalStartDate && !finalEndDate) {
      const now = new Date()
      finalStartDate = new Date(now.getFullYear(), now.getMonth(), 1)
      finalEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    }

    const expenses = await getExpenses(groupId, {
      categoryId: categoryId || undefined,
      startDate: finalStartDate,
      endDate: finalEndDate,
      limit: limit ? parseInt(limit) : undefined,
    })

    return NextResponse.json({ expenses })
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json(
      { error: 'Error al obtener gastos' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo gasto
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      groupId,
      categoryId,
      amount,
      description,
      date,
      isRecurring = false,
      recurringConfig,
      expenseShares, // Para división de gastos compartidos
    } = body

    if (!groupId || !categoryId || !amount) {
      return NextResponse.json(
        { error: 'groupId, categoryId y amount son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el grupo activo del usuario coincida con el grupo proporcionado
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { activeGroupId: true },
    })

    if (!dbUser?.activeGroupId) {
      return NextResponse.json(
        { error: 'No tienes un grupo activo. Por favor, selecciona un grupo primero.' },
        { status: 400 }
      )
    }

    if (dbUser.activeGroupId !== groupId) {
      return NextResponse.json(
        { error: 'El grupo proporcionado no coincide con tu grupo activo. Por favor, cambia al grupo correcto.' },
        { status: 400 }
      )
    }

    const hasAccess = await canUserAccessGroup(user.id, groupId)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'No tienes acceso a este grupo' },
        { status: 403 }
      )
    }

    // Verificar permisos para editar la categoría
    const canEdit = await canUserEditCategory(user.id, categoryId)
    if (!canEdit) {
      return NextResponse.json(
        { error: 'No tienes permisos para agregar gastos a esta categoría' },
        { status: 403 }
      )
    }

    // Crear el gasto
    const parsedDate = date ? parseLocalDate(date) : new Date()
    
    const expense = await createExpense(
      groupId,
      categoryId,
      parseFloat(amount),
      description || null,
      parsedDate,
      user.id,
      isRecurring,
      recurringConfig
    )

    // Si hay división de gastos, crear los ExpenseShare
    if (expenseShares && Array.isArray(expenseShares)) {
      await Promise.all(
        expenseShares.map((share: { userId: string; amount: number; percentage?: number | null }) =>
          prisma.expenseShare.create({
            data: {
              expenseId: expense.id,
              userId: share.userId,
              amount: share.amount,
              percentage: share.percentage || null,
              isPaid: false,
            },
          })
        )
      )
    }

    // Obtener el gasto completo con relaciones
    const expenseWithRelations = await prisma.expense.findUnique({
      where: { id: expense.id },
      include: {
        category: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
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

    return NextResponse.json({ expense: expenseWithRelations }, { status: 201 })
  } catch (error: unknown) {
    console.error('Error creating expense:', error)
    const message = error instanceof Error ? error.message : 'Error al crear gasto'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
