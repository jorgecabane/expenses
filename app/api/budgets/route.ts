import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, canUserAccessGroup } from '@/lib/auth'
import { getMonthlyBudgets, upsertMonthlyBudget } from '@/lib/pockets'

// GET - Obtener presupuestos del mes
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

    const budgets = await getMonthlyBudgets(
      groupId,
      month ? parseInt(month) : undefined,
      year ? parseInt(year) : undefined,
      user.id
    )

    return NextResponse.json({ budgets })
  } catch (error) {
    console.error('Error fetching budgets:', error)
    return NextResponse.json(
      { error: 'Error al obtener presupuestos' },
      { status: 500 }
    )
  }
}

// POST - Asignar presupuesto a bolsillos
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { groupId, allocations, month, year, type } = body

    // type: 'personal' | 'group' | 'both'
    // allocations: [{ categoryId, amount, userId? }]

    if (!groupId || !allocations || !Array.isArray(allocations)) {
      return NextResponse.json(
        { error: 'groupId y allocations son requeridos' },
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
    const budgetMonth = month || now.getMonth() + 1
    const budgetYear = year || now.getFullYear()

    // Crear o actualizar presupuestos
    const results = await Promise.all(
      allocations.map((allocation: { categoryId: string; amount: number; userId?: string }) =>
        upsertMonthlyBudget(
          groupId,
          allocation.categoryId,
          budgetMonth,
          budgetYear,
          allocation.amount,
          allocation.userId || null
        )
      )
    )

    return NextResponse.json({ budgets: results }, { status: 201 })
  } catch (error) {
    console.error('Error creating budgets:', error)
    return NextResponse.json(
      { error: 'Error al asignar presupuesto' },
      { status: 500 }
    )
  }
}
