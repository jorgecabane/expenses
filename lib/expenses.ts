import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { updateBudgetAfterExpense } from '@/lib/pockets'
import { parseLocalDate } from '@/lib/utils'

/**
 * Crea un nuevo gasto y actualiza el bolsillo correspondiente
 */
export async function createExpense(
  groupId: string,
  categoryId: string,
  amount: number,
  description: string | null,
  date: Date | string,
  createdBy: string,
  isRecurring: boolean = false,
  recurringConfig?: unknown
) {
  // Asegurar que date sea un Date en UTC a medianoche
  // Siempre parsear usando parseLocalDate para evitar problemas de zona horaria
  const expenseDate = parseLocalDate(date instanceof Date ? date.toISOString().split('T')[0] : date)

  // Obtener la categoría para saber si es personal o compartida
  const categoryCheck = await prisma.category.findUnique({
    where: { id: categoryId },
  })

  if (!categoryCheck) throw new Error('Category not found')

  // Obtener el presupuesto del mes actual
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  // Buscar el presupuesto - usar findFirst porque userId puede ser null
  const budget = await prisma.monthlyBudget.findFirst({
    where: {
      groupId,
      categoryId,
      month,
      year,
      // Para categorías personales, buscar con el userId del creador
      // Para categorías compartidas, buscar con userId null
      userId: categoryCheck.isPersonal ? createdBy : null,
    },
  })

  // Si es recurrente, crear el template Y la transacción inicial
  if (isRecurring && recurringConfig) {
    // Crear el template recurrente
    const template = await prisma.expense.create({
      data: {
        groupId,
        categoryId,
        amount: amount,
        description,
        date: expenseDate,
        createdBy,
        isRecurring: true,
        recurringConfig: recurringConfig,
      },
    })

    // Crear la transacción inicial para la fecha seleccionada
    const initialExpense = await prisma.expense.create({
      data: {
        groupId,
        categoryId,
        amount: amount,
        description,
        date: expenseDate,
        createdBy,
        isRecurring: false, // Esta es la transacción generada, no el template
      },
    })

    // Actualizar el presupuesto si existe (solo con la transacción inicial)
    if (budget) {
      await updateBudgetAfterExpense(budget.id, amount)
    }

    return template
  }

  // Si no es recurrente, crear solo la transacción normal
  const expense = await prisma.expense.create({
    data: {
      groupId,
      categoryId,
      amount: amount,
      description,
      date: expenseDate,
      createdBy,
      isRecurring,
      ...(recurringConfig ? { recurringConfig: recurringConfig as unknown as Prisma.InputJsonValue } : {}),
    },
  })

  // Actualizar el presupuesto si existe
  if (budget) {
    await updateBudgetAfterExpense(budget.id, amount)
  }

  return expense
}

/**
 * Obtiene los gastos de un grupo con filtros opcionales
 */
export async function getExpenses(
  groupId: string,
  options?: {
    categoryId?: string
    userId?: string
    startDate?: Date
    endDate?: Date
    limit?: number
  }
) {
  const where: {
    groupId: string
    date?: {
      gte?: Date
      lte?: Date
    }
    categoryId?: string
    createdBy?: string
    isRecurring?: boolean
  } = {
    groupId,
  }

  if (options?.categoryId) {
    where.categoryId = options.categoryId
  }

  if (options?.userId) {
    where.createdBy = options.userId
  }

  if (options?.startDate || options?.endDate) {
    where.date = {}
    if (options.startDate) where.date.gte = options.startDate
    if (options.endDate) where.date.lte = options.endDate
  }

  return prisma.expense.findMany({
    where,
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
    orderBy: [
      { date: 'desc' },
      { createdAt: 'desc' },
    ],
    take: options?.limit,
  })
}
