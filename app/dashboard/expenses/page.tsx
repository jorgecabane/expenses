import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ExpensesList from '@/components/ExpensesList'

export const dynamic = 'force-dynamic'

export default async function ExpensesPage() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  // Obtener el grupo activo del usuario
  const membership = await prisma.groupMember.findFirst({
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

  if (!membership) {
    redirect('/dashboard/setup')
  }

  const activeGroup = membership.group

  // Obtener todos los gastos del grupo (últimos 3 meses por defecto)
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  const expenses = await prisma.expense.findMany({
    where: {
      groupId: activeGroup.id,
      date: {
        gte: threeMonthsAgo,
      },
    },
    include: {
      category: {
        include: {
          owner: true,
        },
      },
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
  })

  // Preparar datos para el cliente
  const expensesData = expenses.map(exp => ({
    id: exp.id,
    amount: Number(exp.amount),
    description: exp.description || '',
    date: exp.date.toISOString(),
    categoryId: exp.categoryId,
    categoryName: exp.category?.name || 'Sin categoría',
    categoryIcon: exp.category?.icon || '📁',
    categoryColor: exp.category?.color || 'bg-gray-500',
    isPersonal: exp.category?.isPersonal || false,
    creatorId: exp.creatorId,
    creatorName: exp.creator?.name || exp.creator?.email?.split('@')[0] || 'Usuario',
    isOwner: exp.creatorId === user.id,
  }))

  const categoriesData = activeGroup.categories.map(cat => ({
    id: cat.id,
    name: cat.name,
    icon: cat.icon,
    color: cat.color,
    isPersonal: cat.isPersonal,
    ownerId: cat.ownerId,
  }))

  // Calcular totales
  const totalExpenses = expensesData.reduce((acc, exp) => acc + exp.amount, 0)
  
  // Por mes actual
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const thisMonthExpenses = expensesData.filter(exp => new Date(exp.date) >= startOfMonth)
  const thisMonthTotal = thisMonthExpenses.reduce((acc, exp) => acc + exp.amount, 0)

  return (
    <ExpensesList
      expenses={expensesData}
      categories={categoriesData}
      groupId={activeGroup.id}
      groupCurrency={activeGroup.currency}
      totalExpenses={totalExpenses}
      thisMonthTotal={thisMonthTotal}
      currentUserId={user.id}
    />
  )
}
