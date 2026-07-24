import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, canUserAccessGroup, canUserEditCategory } from '@/lib/auth'
import { createExpense, getExpenses } from '@/lib/expenses'
import { prisma } from '@/lib/prisma'
import { parseLocalDate } from '@/lib/utils'

// GET - Obtener gastos
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext(request)
    if (!auth) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    // Un token queda atado a un solo espacio: si no viene groupId, se usa el del token;
    // si viene uno distinto, se rechaza (nunca puede consultar otro espacio).
    const groupId = searchParams.get('groupId') || (auth.type === 'token' ? auth.groupId : null)
    const categoryId = searchParams.get('categoryId')
    const accountType = searchParams.get('accountType')
    const source = searchParams.get('source') // DEPRECADO: back-compat
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = searchParams.get('limit')

    if (!groupId) {
      return NextResponse.json(
        { error: 'groupId es requerido' },
        { status: 400 }
      )
    }

    if (auth.type === 'token' && groupId !== auth.groupId) {
      return NextResponse.json(
        { error: 'Este token no tiene acceso a ese grupo' },
        { status: 403 }
      )
    }

    const hasAccess = await canUserAccessGroup(auth.userId, groupId)
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

    const resolvedAccountType =
      accountType ||
      (source === 'santander_credit_card' ? 'credit' : source === 'santander_checking' ? 'checking' : undefined)

    const expenses = await getExpenses(groupId, {
      categoryId: categoryId || undefined,
      accountType: resolvedAccountType || undefined,
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
    const auth = await getAuthContext(request)
    if (!auth) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      categoryId,
      amount,
      description,
      date,
      isRecurring = false,
      recurringConfig,
      expenseShares, // Para división de gastos compartidos
      bank,
      accountType,
      source, // DEPRECADO: back-compat, se deriva a bank+accountType
      externalId,
    } = body

    // Proveniencia: preferir bank/accountType del body; si viene el `source` viejo,
    // derivarlo. Manual (sin nada) → checking por defecto.
    let resolvedBank: string | null = bank ?? null
    let resolvedAccountType: string = accountType ?? 'checking'
    if (!bank && !accountType && source) {
      if (source === 'santander_credit_card') { resolvedBank = 'santander'; resolvedAccountType = 'credit' }
      else if (source === 'santander_checking') { resolvedBank = 'santander'; resolvedAccountType = 'checking' }
    }

    // Un token nunca puede escribir fuera de su espacio: el groupId siempre sale del
    // token, sin importar lo que mande el cliente. Solo la sesión por cookie puede
    // elegir groupId libremente (validado contra el activeGroupId más abajo).
    const groupId = auth.type === 'token' ? auth.groupId : body.groupId

    if (!groupId || !amount) {
      return NextResponse.json(
        { error: 'groupId y amount son requeridos' },
        { status: 400 }
      )
    }

    if (auth.type === 'session') {
      // Verificar que el grupo activo del usuario coincida con el grupo proporcionado
      const dbUser = await prisma.user.findUnique({
        where: { id: auth.userId },
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
    }

    const hasAccess = await canUserAccessGroup(auth.userId, groupId)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'No tienes acceso a este grupo' },
        { status: 403 }
      )
    }

    // Deduplicación: si ya existe un gasto con este (bank, accountType, externalId), es
    // un reintento/ventana superpuesta de una integración externa - no crear otro.
    if (externalId && resolvedBank) {
      const existing = await prisma.expense.findFirst({
        where: { bank: resolvedBank, accountType: resolvedAccountType, externalId },
        include: { category: true },
      })
      if (existing) {
        return NextResponse.json({ expense: existing, deduped: true })
      }
    }

    // Si no viene categoryId (ej. baja confianza de una categorización automática),
    // cae al bolsillo "Sin categorizar" del grupo.
    let resolvedCategoryId = categoryId
    if (!resolvedCategoryId) {
      const fallback = await prisma.category.findFirst({
        where: { groupId, name: 'Sin categorizar' },
      })
      if (!fallback) {
        return NextResponse.json(
          {
            error:
              'No se envió categoryId y no existe un bolsillo "Sin categorizar" en este grupo. Creá uno desde la app.',
          },
          { status: 400 }
        )
      }
      resolvedCategoryId = fallback.id
    }

    // Verificar permisos para editar la categoría
    const canEdit = await canUserEditCategory(auth.userId, resolvedCategoryId)
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
      resolvedCategoryId,
      parseFloat(amount),
      description || null,
      parsedDate,
      auth.userId,
      isRecurring,
      recurringConfig,
      resolvedAccountType,
      externalId && resolvedBank ? { bank: resolvedBank, externalId } : undefined
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
