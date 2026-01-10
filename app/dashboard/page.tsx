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

  // Obtener el grupo activo (por ahora el primero)
  const activeGroup = memberships[0].group
  
  // Obtener el mes actual
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const daysInMonth = endOfMonth.getDate()
  const currentDay = now.getDate()
  const daysRemaining = daysInMonth - currentDay

  // Obtener gastos del mes actual
  const expenses = await prisma.expense.findMany({
    where: {
      groupId: activeGroup.id,
      date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
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

  // Obtener ingresos del mes actual
  const incomes = await prisma.income.findMany({
    where: {
      groupId: activeGroup.id,
      date: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
    },
  })
  const totalIncome = incomes.reduce((acc, inc) => acc + Number(inc.amount), 0)

  // Calcular gastos por categoría
  const expensesByCategory: Record<string, number> = {}
  expenses.forEach(exp => {
    const catId = exp.categoryId
    expensesByCategory[catId] = (expensesByCategory[catId] || 0) + Number(exp.amount)
  })

  // Preparar datos de bolsillos
  const pockets = activeGroup.categories.map(cat => {
    const catWithOwner = cat as typeof cat & { owner?: { id: string; email: string; name?: string | null } | null }
    const isOwner = catWithOwner.owner?.id === user.id
    const ownerName = catWithOwner.owner?.name || catWithOwner.owner?.email?.split('@')[0] || 'Usuario'
    
    return {
      id: cat.id,
      name: cat.name,
      emoji: cat.icon || '📁',
      color: cat.color || 'bg-gray-500',
      spent: expensesByCategory[cat.id] || 0,
      limit: Number((cat as { monthlyLimit?: number | null }).monthlyLimit) || 0,
      isPersonal: cat.isPersonal,
      ownerId: cat.ownerId,
      ownerName: cat.isPersonal ? ownerName : null,
      isOwner: cat.isPersonal ? isOwner : true,
      isReadOnly: cat.isPersonal && !isOwner,
    }
  })

  // Calcular totales
  const totalSpent = pockets.reduce((acc, p) => acc + p.spent, 0)
  const totalLimit = pockets.reduce((acc, p) => acc + p.limit, 0)
  const remainingBudget = totalLimit - totalSpent
  const spentPercentage = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0
  const dailySuggested = daysRemaining > 0 ? Math.round(remainingBudget / daysRemaining) : 0

  // Transacciones recientes
  const recentTransactions = expenses.slice(0, 5).map(exp => ({
    id: exp.id,
    description: exp.description || 'Sin descripción',
    amount: Number(exp.amount),
    category: exp.category?.name || 'Sin categoría',
    emoji: exp.category?.icon || '📁',
    date: formatRelativeDate(exp.date),
    creatorName: exp.creator?.name || exp.creator?.email?.split('@')[0] || 'Usuario',
    isOwner: exp.createdBy === user.id,
  }))

  // Preparar categorías para el formulario
  const categories = activeGroup.categories.map(cat => ({
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
