import { prisma } from '@/lib/prisma'
import { calculatePocketStatus } from '@/lib/calculations'

/**
 * Obtiene todos los bolsillos (presupuestos) del mes actual para un grupo
 */
export async function getMonthlyBudgets(
  groupId: string,
  month: number = new Date().getMonth() + 1,
  year: number = new Date().getFullYear(),
  userId?: string
) {
  const where: {
    groupId: string
    month: number
    year: number
    userId?: string | null
    OR?: Array<{ userId: string | null }>
  } = {
    groupId,
    month,
    year,
  }

  // Si se especifica userId, filtrar por bolsillos personales de ese usuario
  // Si no, obtener todos (compartidos y personales)
  if (userId) {
    where.OR = [
      { userId: null }, // Compartidos
      { userId }, // Personales del usuario
    ]
  }

  return prisma.monthlyBudget.findMany({
    where,
    include: {
      category: true,
    },
    orderBy: [
      { category: { name: 'asc' } },
    ],
  })
}

/**
 * Crea o actualiza un presupuesto mensual para un bolsillo
 */
export async function upsertMonthlyBudget(
  groupId: string,
  categoryId: string,
  month: number,
  year: number,
  allocatedAmount: number,
  userId?: string | null
) {
  // Primero obtener el presupuesto existente si existe
  const existing = await prisma.monthlyBudget.findUnique({
    where: {
      groupId_categoryId_month_year_userId: {
        groupId,
        categoryId,
        month,
        year,
        userId: userId ?? null,
        } as any, // Prisma type issue with nullable unique constraints
    },
  })

  // Prisma convierte automáticamente números a Decimal
  const currentSpent = existing?.spentAmount ? Number(existing.spentAmount) : 0
  const newRemaining = allocatedAmount - currentSpent

  return prisma.monthlyBudget.upsert({
    where: {
      groupId_categoryId_month_year_userId: {
        groupId,
        categoryId,
        month,
        year,
        userId: userId ?? null,
        } as any, // Prisma type issue with nullable unique constraints
    },
    create: {
      groupId,
      categoryId,
      month,
      year,
      userId: userId || null,
      allocatedAmount: allocatedAmount,
      spentAmount: 0,
      remainingAmount: allocatedAmount,
    },
    update: {
      allocatedAmount: allocatedAmount,
      remainingAmount: newRemaining,
    },
  })
}

/**
 * Actualiza el monto gastado de un bolsillo después de agregar un gasto
 */
// Incrementos atómicos: el read-modify-write anterior perdía actualizaciones cuando
// dos gastos de la misma categoría entraban a la vez (bank-sync ahora postea en
// paralelo). Además es menos código y una sola ida a la base.
export async function updateBudgetAfterExpense(
  budgetId: string,
  expenseAmount: number
) {
  return prisma.monthlyBudget.update({
    where: { id: budgetId },
    data: {
      spentAmount: { increment: expenseAmount },
      remainingAmount: { decrement: expenseAmount },
    },
  })
}

/**
 * Obtiene el estado visual de un bolsillo
 */
export function getPocketStatusInfo(
  allocated: number | { toNumber: () => number },
  spent: number | { toNumber: () => number }
) {
  const status = calculatePocketStatus(allocated, spent)
  const allocatedNum = typeof allocated === 'number' ? allocated : allocated.toNumber()
  const spentNum = typeof spent === 'number' ? spent : spent.toNumber()
  const percentage = allocatedNum > 0 ? (spentNum / allocatedNum) * 100 : 0
  const remaining = allocatedNum - spentNum

  const colors = {
    healthy: 'rgb(16, 185, 129)', // Verde esmeralda
    warning: 'rgb(245, 158, 11)', // Amarillo
    critical: 'rgb(239, 68, 68)', // Rojo
    empty: 'rgb(156, 163, 175)', // Gris
  }

  return {
    status,
    percentage: Math.round(percentage),
    remaining,
    color: colors[status],
  }
}
