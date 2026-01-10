'use client'

import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'

interface ExpenseListProps {
  expenses: any[]
}

export default function ExpenseList({ expenses }: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay gastos registrados aún
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {expenses.map((expense) => (
        <div
          key={expense.id}
          className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3 flex-1">
            <span className="text-2xl">
              {expense.category.icon || '💰'}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium truncate">
                  {expense.description || 'Sin descripción'}
                </p>
                {expense.category.isPersonal ? (
                  <Badge variant="outline" className="text-xs">
                    Personal
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    Compartido
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{expense.category.name}</span>
                <span>•</span>
                <span>{format(new Date(expense.date), 'd MMM yyyy')}</span>
                <span>•</span>
                <span>{expense.creator.name || expense.creator.email}</span>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold">
                {new Intl.NumberFormat('es-AR', {
                  style: 'currency',
                  currency: 'ARS',
                }).format(expense.amount.toNumber())}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
