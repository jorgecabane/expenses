import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { getCurrentUser, canUserAccessGroup } from '@/lib/auth'
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
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { groupId, amount, description, date, type, isRecurring = false, recurringConfig } = body

    // type: 'personal' | 'group'
    // Si es 'group', userId = null (presupuesto del grupo)
    // Si es 'personal', userId = user.id (ingreso personal)

    if (!groupId || !amount || !type) {
      return NextResponse.json(
        { error: 'groupId, amount y type son requeridos' },
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

    // Si es recurrente, crear el template Y la transacción inicial
    if (isRecurring && recurringConfig) {
      const incomeDate = date ? parseLocalDate(date) : new Date()
      
      // Crear el template recurrente
      const template = await prisma.income.create({
        data: {
          groupId,
          userId: type === 'personal' ? user.id : null,
          amount: amount,
          description: description || null,
          date: incomeDate,
          createdBy: user.id,
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
          userId: type === 'personal' ? user.id : null,
          amount: amount,
          description: description || null,
          date: incomeDate,
          createdBy: user.id,
          isRecurring: false, // Esta es la transacción generada, no el template
        },
      })

      return NextResponse.json({ income: template }, { status: 201 })
    }

    // Si no es recurrente, crear solo la transacción normal
    const income = await prisma.income.create({
      data: {
        groupId,
        userId: type === 'personal' ? user.id : null,
        amount: amount, // Prisma convierte automáticamente a Decimal
        description: description || null,
        date: date ? parseLocalDate(date) : new Date(),
        createdBy: user.id,
        isRecurring: isRecurring || false,
        ...(recurringConfig ? { recurringConfig: recurringConfig as unknown as Prisma.InputJsonValue } : {}),
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
