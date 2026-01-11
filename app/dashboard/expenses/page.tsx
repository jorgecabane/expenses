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

  // Obtener el usuario con su grupo activo
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { activeGroupId: true },
  })

  // Obtener todos los grupos del usuario
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

  if (memberships.length === 0) {
    redirect('/dashboard/setup')
  }

  // Buscar el grupo activo en los miembros del usuario
  let activeGroup = memberships.find(m => m.group.id === dbUser?.activeGroupId)?.group
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
  
  // Por mes actual usando UTC para evitar problemas de zona horaria
  const now = new Date()
  const currentYear = now.getUTCFullYear()
  const currentMonth = now.getUTCMonth()
  const startOfMonth = new Date(Date.UTC(currentYear, currentMonth, 1))
  const endOfMonth = new Date(Date.UTC(currentYear, currentMonth + 1, 0, 23, 59, 59, 999))
  
  const thisMonthExpenses = expensesData.filter(exp => {
    const expDate = new Date(exp.date)
    // Comparar usando UTC para evitar problemas de zona horaria
    const expYear = expDate.getUTCFullYear()
    const expMonth = expDate.getUTCMonth()
    const expDay = expDate.getUTCDate()
    const startYear = startOfMonth.getUTCFullYear()
    const startMonth = startOfMonth.getUTCMonth()
    const startDay = startOfMonth.getUTCDate()
    const endYear = endOfMonth.getUTCFullYear()
    const endMonth = endOfMonth.getUTCMonth()
    const endDay = endOfMonth.getUTCDate()
    
    // Verificar si la fecha está en el rango usando comparación UTC
    const isInRange = (
      expYear > startYear || 
      (expYear === startYear && expMonth > startMonth) ||
      (expYear === startYear && expMonth === startMonth && expDay >= startDay)
    ) && (
      expYear < endYear ||
      (expYear === endYear && expMonth < endMonth) ||
      (expYear === endYear && expMonth === endMonth && expDay <= endDay)
    )
    
    return isInRange
  })
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
