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
  recurringConfig?: unknown,
  accountType?: string, // 'credit' | 'checking' — proveniencia del gasto
  externalRef?: { bank: string; externalId: string } // dedup para integraciones externas
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

  // Los gastos de bolsillos "excludeFromSpending" (ej. pago de tarjeta) NO inflan el
  // presupuesto: son caja pero no consumo.
  const countsForBudget = !categoryCheck.excludeFromSpending

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
        ...(accountType ? { accountType } : {}),
      },
    })

    // Crear la transacción inicial para la fecha seleccionada
    await prisma.expense.create({
      data: {
        groupId,
        categoryId,
        amount: amount,
        description,
        date: expenseDate,
        createdBy,
        isRecurring: false, // Esta es la transacción generada, no el template
        ...(accountType ? { accountType } : {}),
      },
    })

    // Actualizar el presupuesto si existe (solo con la transacción inicial)
    if (budget && countsForBudget) {
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
      ...(accountType ? { accountType } : {}),
      ...(externalRef ? { bank: externalRef.bank, externalId: externalRef.externalId } : {}),
    },
  })

  // Actualizar el presupuesto si existe
  if (budget && countsForBudget) {
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
    accountType?: string
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
    accountType?: string
  } = {
    groupId,
  }

  if (options?.categoryId) {
    where.categoryId = options.categoryId
  }

  if (options?.userId) {
    where.createdBy = options.userId
  }

  if (options?.accountType) {
    where.accountType = options.accountType
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
