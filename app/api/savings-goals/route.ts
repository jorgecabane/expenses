import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, canUserAccessGroup } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateCurrentSavings } from '@/lib/calculations'

// GET - Obtener metas de ahorro
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')
    const month = searchParams.get('month')
    const year = searchParams.get('year')

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

    const now = new Date()
    const goalMonth = month ? parseInt(month) : now.getMonth() + 1
    const goalYear = year ? parseInt(year) : now.getFullYear()

    const where: any = {
      groupId,
      month: goalMonth,
      year: goalYear,
    }

    const goals = await prisma.savingsGoal.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Calcular ahorro actual para cada meta
    const goalsWithSavings = await Promise.all(
      goals.map(async (goal) => {
        // Obtener ingresos del mes
        const incomes = await prisma.income.findMany({
          where: {
            groupId,
            userId: goal.userId,
            date: {
              gte: new Date(goalYear, goalMonth - 1, 1),
              lt: new Date(goalYear, goalMonth, 1),
            },
          },
        })

        const totalIncome = incomes.reduce(
          (sum, inc) => sum + inc.amount.toNumber(),
          0
        )

        // Obtener gastos del mes
        const expenses = await prisma.expense.findMany({
          where: {
            groupId,
            date: {
              gte: new Date(goalYear, goalMonth - 1, 1),
              lt: new Date(goalYear, goalMonth, 1),
            },
            category: {
              isPersonal: goal.userId !== null,
              ...(goal.userId ? { ownerId: goal.userId } : {}),
            },
          },
        })

        const totalExpenses = expenses.reduce(
          (sum, exp) => sum + exp.amount.toNumber(),
          0
        )

        const currentSaved = calculateCurrentSavings(totalIncome, totalExpenses)

        return {
          ...goal,
          currentSaved,
          progress: goal.targetAmount.toNumber() > 0
            ? (currentSaved / goal.targetAmount.toNumber()) * 100
            : 0,
        }
      })
    )

    return NextResponse.json({ goals: goalsWithSavings })
  } catch (error) {
    console.error('Error fetching savings goals:', error)
    return NextResponse.json(
      { error: 'Error al obtener metas de ahorro' },
      { status: 500 }
    )
  }
}

// POST - Crear o actualizar meta de ahorro
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { groupId, targetAmount, month, year, type } = body

    // type: 'personal' | 'group'

    if (!groupId || !targetAmount || !type) {
      return NextResponse.json(
        { error: 'groupId, targetAmount y type son requeridos' },
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

    const now = new Date()
    const goalMonth = month || now.getMonth() + 1
    const goalYear = year || now.getFullYear()

    const goalUserId: string | null = type === 'personal' ? user.id : null
    
    const goal = await prisma.savingsGoal.upsert({
      where: {
        groupId_userId_month_year: {
          groupId,
          userId: goalUserId,
          month: goalMonth,
          year: goalYear,
        } as any, // Prisma type issue with nullable unique constraints
      },
      create: {
        groupId,
        userId: goalUserId,
        targetAmount: targetAmount, // Prisma convierte automáticamente a Decimal
        month: goalMonth,
        year: goalYear,
        currentSaved: 0,
      },
      update: {
        targetAmount: targetAmount,
      },
    })

    return NextResponse.json({ goal }, { status: 201 })
  } catch (error) {
    console.error('Error creating savings goal:', error)
    return NextResponse.json(
      { error: 'Error al crear meta de ahorro' },
      { status: 500 }
    )
  }
}
