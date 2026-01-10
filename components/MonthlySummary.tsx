import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getDaysRemainingInMonth, getDaysElapsedInMonth } from '@/lib/calculations'
import { format } from 'date-fns'

interface MonthlySummaryProps {
  groupId: string
  month: number
  year: number
}

export default async function MonthlySummary({ groupId, month, year }: MonthlySummaryProps) {
  // Obtener todos los presupuestos del mes
  const budgets = await prisma.monthlyBudget.findMany({
    where: {
      groupId,
      month,
      year,
    },
  })

  // Calcular totales
  const totalAllocated = budgets.reduce(
    (sum, b) => sum + b.allocatedAmount.toNumber(),
    0
  )
  const totalSpent = budgets.reduce((sum, b) => sum + b.spentAmount.toNumber(), 0)
  const totalRemaining = totalAllocated - totalSpent

  // Obtener ingresos/presupuesto del grupo
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59)
  const groupIncome = await prisma.income.findFirst({
    where: {
      groupId,
      userId: null, // Presupuesto del grupo
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  })

  const daysRemaining = getDaysRemainingInMonth()
  const daysElapsed = getDaysElapsedInMonth()
  const averageDailySpending = daysElapsed > 0 ? totalSpent / daysElapsed : 0
  const recommendedDailySpending = daysRemaining > 0 ? totalRemaining / daysRemaining : 0

  const percentageUsed = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Presupuesto del Mes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {new Intl.NumberFormat('es-AR', {
              style: 'currency',
              currency: 'ARS',
            }).format(totalRemaining)}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {percentageUsed.toFixed(0)}% usado
          </p>
          <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${Math.min(percentageUsed, 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Gasto Diario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {new Intl.NumberFormat('es-AR', {
              style: 'currency',
              currency: 'ARS',
            }).format(averageDailySpending)}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Recomendado:{' '}
            {new Intl.NumberFormat('es-AR', {
              style: 'currency',
              currency: 'ARS',
            }).format(recommendedDailySpending)}
            /día
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {daysRemaining} días restantes
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Mes Actual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {format(new Date(year, month - 1, 1), 'MMMM yyyy')}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {format(new Date(), 'd')} de {format(new Date(), 'MMMM')}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
