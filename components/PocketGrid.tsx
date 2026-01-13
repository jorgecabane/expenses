'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, User } from 'lucide-react'
import { getPocketStatusInfo } from '@/lib/pockets'
import Link from 'next/link'

interface Budget {
  id: string
  categoryId: string
  amount: number
  month: number
  year: number
  allocatedAmount: number | { toNumber: () => number }
  spentAmount: number | { toNumber: () => number }
  category?: {
    name: string
    icon?: string | null
    color?: string | null
    isPersonal?: boolean
  } | null
}

interface PocketGridProps {
  budgets: Budget[]
  groupId: string
}

export default function PocketGrid({ budgets, groupId }: PocketGridProps) {
  if (budgets.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No hay bolsillos configurados para este mes. Ve a Configuración para crear categorías.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Bolsillos del Mes</h2>
        <div className="flex gap-2">
          <Badge variant="outline">Todos</Badge>
          <Badge variant="outline">Compartidos</Badge>
          <Badge variant="outline">Personales</Badge>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {budgets.map((budget) => {
          const allocatedAmount = typeof budget.allocatedAmount === 'object' && 'toNumber' in budget.allocatedAmount ? budget.allocatedAmount.toNumber() : budget.allocatedAmount
          const spentAmount = typeof budget.spentAmount === 'object' && 'toNumber' in budget.spentAmount ? budget.spentAmount.toNumber() : budget.spentAmount
          const statusInfo = getPocketStatusInfo(
            allocatedAmount,
            spentAmount
          )
          const percentage = statusInfo.percentage
          const remaining = statusInfo.remaining

          return (
            <Link
              key={budget.id}
              href={`/dashboard/pockets/${budget.categoryId}`}
            >
              <Card className="cursor-pointer transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{budget.category?.icon || '💰'}</span>
                      <div>
                        <h3 className="font-semibold">{budget.category?.name || 'Sin categoría'}</h3>
                        {budget.category?.isPersonal ? (
                          <Badge variant="secondary" className="mt-1">
                            <User className="mr-1 h-3 w-3" />
                            Personal
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="mt-1">
                            <Users className="mr-1 h-3 w-3" />
                            Compartido
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Gastado</span>
                      <span className="font-semibold">
                        {new Intl.NumberFormat('es-AR', {
                          style: 'currency',
                          currency: 'ARS',
                        }).format(spentAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Asignado</span>
                      <span>
                        {new Intl.NumberFormat('es-AR', {
                          style: 'currency',
                          currency: 'ARS',
                        }).format(allocatedAmount)}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden mt-2">
                      <div
                        className="h-full transition-all"
                        style={{
                          width: `${Math.min(percentage, 100)}%`,
                          backgroundColor: statusInfo.color,
                        }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-muted-foreground">
                        {percentage}% usado
                      </span>
                      <span
                        className={`text-lg font-bold ${
                          statusInfo.status === 'healthy'
                            ? 'text-green-600'
                            : statusInfo.status === 'warning'
                            ? 'text-yellow-600'
                            : statusInfo.status === 'critical'
                            ? 'text-red-600'
                            : 'text-gray-600'
                        }`}
                      >
                        {new Intl.NumberFormat('es-AR', {
                          style: 'currency',
                          currency: 'ARS',
                        }).format(remaining)}{' '}
                        restantes
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
