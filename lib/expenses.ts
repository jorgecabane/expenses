import { prisma } from '@/lib/prisma'
import { updateBudgetAfterExpense } from '@/lib/pockets'

/**
 * Crea un nuevo gasto y actualiza el bolsillo correspondiente
 */
export async function createExpense(
  groupId: string,
  categoryId: string,
  amount: number,
  description: string | null,
  date: Date,
  createdBy: string,
  isRecurring: boolean = false,
  recurringConfig?: any
) {

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

  // Crear el gasto (permitir aunque no haya presupuesto definido)
  const expense = await prisma.expense.create({
    data: {
      groupId,
      categoryId,
      amount: amount,
      description,
      date,
      createdBy,
      isRecurring,
      recurringConfig: recurringConfig || null,
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
  const where: any = {
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
