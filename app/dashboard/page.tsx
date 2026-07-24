import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ChevronRight, Sparkles } from 'lucide-react'
import DashboardContent from '@/components/DashboardContent'

export const dynamic = 'force-dynamic'

// Empty state component for new users
function EmptyDashboard({ userName }: { userName: string }) {
  return (
    <div className="max-w-2xl mx-auto text-center py-16">
      <div className="relative mb-8">
        <div className="absolute inset-0 gradient-primary rounded-full blur-3xl opacity-40" />
        <div className="relative w-24 h-24 mx-auto rounded-2xl gradient-primary flex items-center justify-center shadow-2xl shadow-primary/50">
          <Sparkles className="w-12 h-12 text-white" />
        </div>
      </div>
      
      <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
        ¡Bienvenido, {userName}! 👋
      </h1>
      <p className="text-lg text-slate-400 mb-8 max-w-md mx-auto">
        Estás a un paso de empezar a organizar tu dinero. Crea tu primer espacio para comenzar.
      </p>
      
      <Link 
        href="/dashboard/setup"
        className="inline-flex items-center gap-2 gradient-primary text-white font-semibold px-8 py-4 rounded-2xl transition-all group text-lg"
      >
        Configurar mi espacio
        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  )
}

function formatRelativeDate(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (days === 0) return 'Hoy'
  if (days === 1) return 'Ayer'
  if (days < 7) return `Hace ${days} días`
  return date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'Usuario'

  // Verificar si el usuario tiene grupos
  const memberships = await prisma.groupMember.findMany({
    where: { userId: user.id },
    include: {
      group: {
        include: {
          categories: {
            include: {
              owner: true,
            },
          },
        },
      },
    },
  })

  // Si no tiene grupos, mostrar estado vacío
  if (memberships.length === 0) {
    return <EmptyDashboard userName={userName} />
  }

  // Obtener el grupo activo del usuario desde la base de datos
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { activeGroupId: true },
  })
  
  // Buscar el grupo activo en los miembros del usuario
  let activeGroup = memberships.find((m: { group: { id: string } }) => m.group.id === dbUser?.activeGroupId)?.group
  if (!activeGroup) {
    // Si no se encuentra el grupo activo guardado o no existe, usar el primero
    activeGroup = memberships[0].group
    // Guardar el primer grupo como activo si no hay uno guardado
    if (!dbUser?.activeGroupId) {
      await prisma.user.update({
        where: { id: user.id },
        data: { activeGroupId: activeGroup.id },
      })
    }
  }
  
  // Obtener el mes actual usando UTC para evitar problemas de zona horaria
  const now = new Date()
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const endOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999))
  const daysInMonth = endOfMonth.getUTCDate()
  const currentDay = now.getUTCDate()
  const daysRemaining = daysInMonth - currentDay

  // Obtener gastos del mes actual (sin límite para calcular correctamente los bolsillos)
  const allExpenses = await prisma.expense.findMany({
    where: {
      groupId: activeGroup.id,
      date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
      isRecurring: false, // Solo transacciones generadas, no templates
    },
    include: {
      category: true,
    },
  })

  // Obtener solo los primeros 10 gastos para mostrar en transacciones recientes
  const expenses = await prisma.expense.findMany({
    where: {
      groupId: activeGroup.id,
      date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
      isRecurring: false, // Solo transacciones generadas, no templates
    },
    include: {
      category: true,
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: [
      { date: 'desc' },
      { createdAt: 'desc' },
    ],
    take: 10,
  })

  // Obtener ingresos del mes actual usando UTC
  const incomes = await prisma.income.findMany({
    where: {
      groupId: activeGroup.id,
      date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
      isRecurring: false, // Solo transacciones generadas, no templates
    },
  })
  const totalIncome = incomes.reduce((acc: number, inc: { amount: number | string | { toString: () => string; toNumber: () => number } }) => {
    const amount = typeof inc.amount === 'object' && 'toNumber' in inc.amount ? inc.amount.toNumber() : Number(inc.amount)
    return acc + amount
  }, 0)

  const num = (a: number | string | { toNumber: () => number }) =>
    typeof a === 'object' && 'toNumber' in a ? a.toNumber() : Number(a)

  // CONSUMO por bolsillo: excluye categorías excludeFromSpending (ej. pago de tarjeta),
  // para no doble-contar (las compras de tarjeta ya están en sus bolsillos).
  const expensesByCategory: Record<string, number> = {}
  allExpenses.forEach((exp) => {
    if (exp.category?.excludeFromSpending) return
    expensesByCategory[exp.categoryId] = (expensesByCategory[exp.categoryId] || 0) + num(exp.amount)
  })

  // SALIDA DE CAJA: plata que salió de la cuenta corriente (checking incl. pago de
  // tarjeta); excluye compras de tarjeta (se pagan el próximo mes).
  const salidaCaja = allExpenses
    .filter((exp) => (exp.accountType ?? 'checking') !== 'credit')
    .reduce((acc, exp) => acc + num(exp.amount), 0)

  // PENDIENTE EN TARJETA: compras de tarjeta del mes (consumo) que pagas el próximo mes.
  const pendienteTarjeta = allExpenses
    .filter((exp) => exp.accountType === 'credit' && !exp.category?.excludeFromSpending)
    .reduce((acc, exp) => acc + num(exp.amount), 0)

  // Preparar datos de bolsillos (ocultar los excludeFromSpending: no son consumo)
  const pockets = activeGroup.categories
    .filter((cat: { excludeFromSpending?: boolean }) => !cat.excludeFromSpending)
    .map((cat: {
    id: string
    name: string
    icon: string | null
    color: string | null
    isPersonal: boolean
    ownerId: string | null
    monthlyLimit: number | null | { toString: () => string; toNumber: () => number }
    owner?: { id: string; email: string; name?: string | null } | null
  }) => {
    const isOwner = cat.owner?.id === user.id
    const ownerName = cat.owner?.name || cat.owner?.email?.split('@')[0] || 'Usuario'
    
    return {
      id: cat.id,
      name: cat.name,
      emoji: cat.icon || '📁',
      color: cat.color || 'bg-gray-500',
      spent: expensesByCategory[cat.id] || 0,
      limit: cat.monthlyLimit ? (typeof cat.monthlyLimit === 'object' && 'toNumber' in cat.monthlyLimit ? cat.monthlyLimit.toNumber() : Number(cat.monthlyLimit)) : 0,
      isPersonal: cat.isPersonal,
      ownerId: cat.ownerId,
      ownerName: cat.isPersonal ? ownerName : null,
      isOwner: cat.isPersonal ? isOwner : true,
      isReadOnly: cat.isPersonal && !isOwner,
    }
  })

  // Calcular totales
  const totalSpent = pockets.reduce((acc: number, p: { spent: number }) => acc + p.spent, 0)
  const totalLimit = pockets.reduce((acc: number, p: { limit: number }) => acc + p.limit, 0)
  const remainingBudget = totalLimit - totalSpent
  const spentPercentage = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0
  const dailySuggested = daysRemaining > 0 ? Math.round(remainingBudget / daysRemaining) : 0

  // Transacciones recientes
  const recentTransactions = expenses.slice(0, 5).map((exp: {
    id: string
    description: string | null
    amount: number | string | { toString: () => string; toNumber: () => number }
    category: { name: string; icon?: string | null } | null
    creator?: { name: string | null; email: string } | null
    createdBy: string
    date: Date
    accountType?: string | null
  }) => ({
    id: exp.id,
    description: exp.description || 'Sin descripción',
    amount: typeof exp.amount === 'object' && 'toNumber' in exp.amount ? exp.amount.toNumber() : Number(exp.amount),
    category: (exp.category as { name: string; icon?: string | null } | null)?.name || 'Sin categoría',
    emoji: exp.category?.icon || '📁',
    date: formatRelativeDate(exp.date),
    creatorName: exp.creator?.name || exp.creator?.email?.split('@')[0] || 'Usuario',
    isOwner: exp.createdBy === user.id,
    accountType: exp.accountType ?? 'checking',
  }))

  // Preparar categorías para el formulario
  const categories = activeGroup.categories.map((cat: { id: string; name: string; icon: string | null; color: string | null; isPersonal: boolean; ownerId: string | null }) => ({
    id: cat.id,
    name: cat.name,
    icon: cat.icon,
    color: cat.color,
    isPersonal: cat.isPersonal,
    ownerId: cat.ownerId,
  }))

  return (
    <DashboardContent
      groupId={activeGroup.id}
      groupCurrency={activeGroup.currency}
      pockets={pockets}
      recentTransactions={recentTransactions}
      totalSpent={totalSpent}
      salidaCaja={salidaCaja}
      pendienteTarjeta={pendienteTarjeta}
      totalLimit={totalLimit}
      totalIncome={totalIncome}
      remainingBudget={remainingBudget}
      spentPercentage={spentPercentage}
      dailySuggested={dailySuggested}
      daysRemaining={daysRemaining}
      categories={categories}
    />
  )
}
