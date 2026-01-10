import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ReportsContent from '@/components/ReportsContent'

export const dynamic = 'force-dynamic'

export default async function ReportsPage() {
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
          categories: true,
        },
      },
    },
  })

  if (!membership) {
    redirect('/dashboard/setup')
  }

  const activeGroup = membership.group
  
  // Obtener últimos 6 meses de datos
  const now = new Date()
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  
  // Obtener todos los gastos de los últimos 6 meses
  const expenses = await prisma.expense.findMany({
    where: {
      groupId: activeGroup.id,
      date: {
        gte: sixMonthsAgo,
      },
    },
    include: {
      category: true,
    },
    orderBy: {
      date: 'desc',
    },
  })

  // Obtener todos los ingresos de los últimos 6 meses
  const incomes = await prisma.income.findMany({
    where: {
      groupId: activeGroup.id,
      date: {
        gte: sixMonthsAgo,
      },
    },
    orderBy: {
      date: 'desc',
    },
  })

  // Preparar datos por mes
  const monthlyData: Record<string, { 
    month: string
    year: number
    monthNum: number
    expenses: number
    income: number 
  }> = {}
  
  // Inicializar últimos 6 meses
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const monthName = d.toLocaleDateString('es-CL', { month: 'short' })
    monthlyData[key] = { 
      month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
      year: d.getFullYear(),
      monthNum: d.getMonth(),
      expenses: 0, 
      income: 0 
    }
  }

  // Sumar gastos por mes
  expenses.forEach(exp => {
    const d = new Date(exp.date)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (monthlyData[key]) {
      monthlyData[key].expenses += Number(exp.amount)
    }
  })

  // Sumar ingresos por mes
  incomes.forEach(inc => {
    const d = new Date(inc.date)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (monthlyData[key]) {
      monthlyData[key].income += Number(inc.amount)
    }
  })

  const monthlyTrend = Object.values(monthlyData)

  // Preparar datos por categoría (mes actual)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const currentMonthExpenses = expenses.filter(exp => new Date(exp.date) >= startOfMonth)
  
  const byCategory: Record<string, { name: string; icon: string; color: string; amount: number }> = {}
  
  currentMonthExpenses.forEach(exp => {
    const catId = exp.categoryId
    if (!byCategory[catId]) {
      byCategory[catId] = {
        name: exp.category?.name || 'Sin categoría',
        icon: exp.category?.icon || '📁',
        color: exp.category?.color || 'bg-gray-500',
        amount: 0,
      }
    }
    byCategory[catId].amount += Number(exp.amount)
  })

  const categoryData = Object.values(byCategory)
    .sort((a, b) => b.amount - a.amount)

  // Calcular totales del mes actual
  const thisMonthExpenses = currentMonthExpenses.reduce((acc, exp) => acc + Number(exp.amount), 0)
  const thisMonthIncomes = incomes
    .filter(inc => new Date(inc.date) >= startOfMonth)
    .reduce((acc, inc) => acc + Number(inc.amount), 0)

  // Calcular totales de todos los tiempos
  const totalExpenses = expenses.reduce((acc, exp) => acc + Number(exp.amount), 0)
  const totalIncomes = incomes.reduce((acc, inc) => acc + Number(inc.amount), 0)

  // Calcular promedios
  const avgMonthlyExpenses = totalExpenses / 6
  const avgMonthlyIncome = totalIncomes / 6

  return (
    <ReportsContent
      currency={activeGroup.currency}
      monthlyTrend={monthlyTrend}
      categoryData={categoryData}
      thisMonthExpenses={thisMonthExpenses}
      thisMonthIncomes={thisMonthIncomes}
      totalExpenses={totalExpenses}
      totalIncomes={totalIncomes}
      avgMonthlyExpenses={avgMonthlyExpenses}
      avgMonthlyIncome={avgMonthlyIncome}
    />
  )
}
