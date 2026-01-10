/**
 * Calcula el estado de un bolsillo basado en el porcentaje usado
 */
export function calculatePocketStatus(
  allocated: number | { toNumber: () => number },
  spent: number | { toNumber: () => number }
): 'healthy' | 'warning' | 'critical' | 'empty' {
  const allocatedNum = typeof allocated === 'number' ? allocated : allocated.toNumber()
  const spentNum = typeof spent === 'number' ? spent : spent.toNumber()
  
  if (allocatedNum === 0) return 'empty'
  
  const percentage = (spentNum / allocatedNum) * 100
  const remaining = allocatedNum - spentNum
  
  if (remaining <= 0) return 'empty'
  if (percentage >= 80) return 'critical'
  if (percentage >= 50) return 'warning'
  return 'healthy'
}

/**
 * Calcula el gasto diario recomendado para llegar a fin de mes
 */
export function calculateDailySpendingRecommendation(
  allocated: number | { toNumber: () => number },
  spent: number | { toNumber: () => number },
  daysRemaining: number
): number {
  const allocatedNum = typeof allocated === 'number' ? allocated : allocated.toNumber()
  const spentNum = typeof spent === 'number' ? spent : spent.toNumber()
  const remaining = allocatedNum - spentNum
  
  if (daysRemaining <= 0) return 0
  return remaining / daysRemaining
}

/**
 * Calcula el gasto diario promedio actual
 */
export function calculateAverageDailySpending(
  spent: number | { toNumber: () => number },
  daysElapsed: number
): number {
  const spentNum = typeof spent === 'number' ? spent : spent.toNumber()
  if (daysElapsed <= 0) return 0
  return spentNum / daysElapsed
}

/**
 * Calcula el ahorro actual (ingresos - gastos)
 */
export function calculateCurrentSavings(
  incomes: number | { toNumber: () => number },
  expenses: number | { toNumber: () => number }
): number {
  const incomesNum = typeof incomes === 'number' ? incomes : incomes.toNumber()
  const expensesNum = typeof expenses === 'number' ? expenses : expenses.toNumber()
  return incomesNum - expensesNum
}

/**
 * Obtiene los días restantes del mes
 */
export function getDaysRemainingInMonth(date: Date = new Date()): number {
  const year = date.getFullYear()
  const month = date.getMonth()
  const lastDay = new Date(year, month + 1, 0).getDate()
  const currentDay = date.getDate()
  return lastDay - currentDay
}

/**
 * Obtiene los días transcurridos del mes
 */
export function getDaysElapsedInMonth(date: Date = new Date()): number {
  return date.getDate()
}
