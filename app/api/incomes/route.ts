import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { getAuthContext, getCurrentUser, canUserAccessGroup } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseLocalDate } from '@/lib/utils'

// GET - Obtener ingresos
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

    const where: {
      groupId: string
      date?: {
        gte: Date
        lte: Date
      }
    } = {
      groupId,
    }

    // Si no se especifica mes/año, usar el mes actual
    // Usar UTC para evitar problemas de zona horaria
    const now = new Date()
    const targetMonth = month ? parseInt(month) : now.getUTCMonth() + 1
    const targetYear = year ? parseInt(year) : now.getUTCFullYear()
    
    // Crear fechas en UTC: primer día del mes y último día del mes a medianoche UTC
    const startDate = new Date(Date.UTC(targetYear, targetMonth - 1, 1))
    // Último día del mes: usar el día 0 del mes siguiente (que es el último día del mes actual)
    const endDate = new Date(Date.UTC(targetYear, targetMonth, 0, 23, 59, 59, 999))
    
    where.date = {
      gte: startDate,
      lte: endDate,
    }

    // Obtener ingresos del mes (excluir templates recurrentes)
    const incomes = await prisma.income.findMany({
      where: {
        ...where,
        isRecurring: false, // Solo transacciones generadas, no templates
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
      orderBy: {
        date: 'desc',
      },
    })

    // Obtener templates recurrentes si se solicita
    const includeRecurring = searchParams.get('includeRecurring') === 'true'
    const recurringTemplates = includeRecurring ? await prisma.income.findMany({
      where: {
        groupId,
        isRecurring: true,
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
      orderBy: {
        createdAt: 'desc',
      },
    }) : []

    return NextResponse.json({ 
      incomes,
      ...(includeRecurring && { recurringTemplates }),
    })
  } catch (error) {
    console.error('Error fetching incomes:', error)
    return NextResponse.json(
      { error: 'Error al obtener ingresos' },
      { status: 500 }
    )
  }
}

// POST - Crear ingreso o presupuesto del grupo
export async function POST(request: NextRequest) {
  try {
    // Acepta sesión (la app) o token de API (bank-sync), igual que /api/expenses.
    const auth = await getAuthContext(request)
    if (!auth) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const {
      amount, description, date, isRecurring = false, recurringConfig,
      bank, accountType, externalId,
    } = body
    const type = body.type ?? 'group'
    // Un token está atado a su espacio; la sesión usa el que venga en el body.
    const groupId = body.groupId || (auth.type === 'token' ? auth.groupId : null)

    if (!groupId || !amount) {
      return NextResponse.json(
        { error: 'groupId y amount son requeridos' },
        { status: 400 }
      )
    }

    if (auth.type === 'token' && groupId !== auth.groupId) {
      return NextResponse.json(
        { error: 'Este token no tiene acceso a ese grupo' },
        { status: 403 }
      )
    }

    // Solo la sesión queda atada al grupo activo: un token ya está acotado al suyo.
    if (auth.type === 'session') {
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

    // Dedup para integraciones: el mismo abono del banco no se importa dos veces.
    if (externalId && bank) {
      const existing = await prisma.income.findFirst({
        where: { bank, accountType: accountType ?? null, externalId },
      })
      if (existing) {
        return NextResponse.json({ income: existing, deduped: true })
      }
    }

    // Si es recurrente, crear el template Y la transacción inicial
    if (isRecurring && recurringConfig) {
      const incomeDate = date ? parseLocalDate(date) : new Date()
      
      // Crear el template recurrente
      const template = await prisma.income.create({
        data: {
          groupId,
          userId: type === 'personal' ? auth.userId : null,
          amount: amount,
          description: description || null,
          date: incomeDate,
          createdBy: auth.userId,
          isRecurring: true,
          recurringConfig: recurringConfig,
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

      // Crear la transacción inicial para la fecha seleccionada
      await prisma.income.create({
        data: {
          groupId,
          userId: type === 'personal' ? auth.userId : null,
          amount: amount,
          description: description || null,
          date: incomeDate,
          createdBy: auth.userId,
          isRecurring: false, // Esta es la transacción generada, no el template
        },
      })

      return NextResponse.json({ income: template }, { status: 201 })
    }

    // Si no es recurrente, crear solo la transacción normal
    const income = await prisma.income.create({
      data: {
        groupId,
        userId: type === 'personal' ? auth.userId : null,
        amount: amount, // Prisma convierte automáticamente a Decimal
        description: description || null,
        date: date ? parseLocalDate(date) : new Date(),
        createdBy: auth.userId,
        isRecurring: isRecurring || false,
        ...(recurringConfig ? { recurringConfig: recurringConfig as unknown as Prisma.InputJsonValue } : {}),
        // Origen bancario: sin esto el dedup de la próxima corrida no encuentra nada.
        ...(externalId && bank ? { bank, accountType: accountType ?? null, externalId } : {}),
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

    return NextResponse.json({ income }, { status: 201 })
  } catch (error) {
    console.error('Error creating income:', error)
    return NextResponse.json(
      { error: 'Error al crear ingreso' },
      { status: 500 }
    )
  }
}
