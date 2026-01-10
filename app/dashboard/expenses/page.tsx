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
  // Excluir templates recurrentes (solo mostrar transacciones generadas)
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  const expenses = await prisma.expense.findMany({
    where: {
      groupId: activeGroup.id,
      date: {
        gte: threeMonthsAgo,
      },
      isRecurring: false, // Solo transacciones generadas, no templates
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

  // Obtener templates recurrentes (solo los que tienen isRecurring = true)
  const recurringTemplates = await prisma.expense.findMany({
    where: {
      groupId: activeGroup.id,
      isRecurring: true,
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
    orderBy: {
      createdAt: 'desc',
    },
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
    creatorId: exp.createdBy,
    creatorName: exp.creator?.name || exp.creator?.email?.split('@')[0] || 'Usuario',
    isOwner: exp.createdBy === user.id,
  }))

  const categoriesData = activeGroup.categories.map(cat => ({
    id: cat.id,
    name: cat.name,
    icon: cat.icon,
    color: cat.color,
    isPersonal: cat.isPersonal,
    ownerId: cat.ownerId,
  }))

  // Preparar datos de templates recurrentes
  const recurringTemplatesData = recurringTemplates.map(template => ({
    id: template.id,
    amount: Number(template.amount),
    description: template.description || '',
    date: template.date.toISOString(),
    categoryId: template.categoryId,
    categoryName: template.category?.name || 'Sin categoría',
    categoryIcon: template.category?.icon || '📁',
    categoryColor: template.category?.color || 'bg-gray-500',
    isPersonal: template.category?.isPersonal || false,
    creatorId: template.createdBy,
    creatorName: template.creator?.name || template.creator?.email?.split('@')[0] || 'Usuario',
    isOwner: template.createdBy === user.id,
    recurringConfig: template.recurringConfig as any,
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
      recurringTemplates={recurringTemplatesData}
      categories={categoriesData}
      groupId={activeGroup.id}
      groupCurrency={activeGroup.currency}
      totalExpenses={totalExpenses}
      thisMonthTotal={thisMonthTotal}
      currentUserId={user.id}
    />
  )
}
