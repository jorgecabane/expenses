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
          categories: true,
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
  
  // Obtener últimos 6 meses de datos
  // Usar UTC para evitar problemas de zona horaria
  const now = new Date()
  const sixMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1))
  
  // Obtener todos los gastos de los últimos 6 meses (excluir templates recurrentes)
  const expenses = await prisma.expense.findMany({
    where: {
      groupId: activeGroup.id,
      date: {
        gte: sixMonthsAgo,
      },
      isRecurring: false, // Solo transacciones generadas, no templates
    },
    include: {
      category: true,
    },
    orderBy: {
      date: 'desc',
    },
  })

  // Obtener todos los ingresos de los últimos 6 meses (excluir templates recurrentes)
  const incomes = await prisma.income.findMany({
    where: {
      groupId: activeGroup.id,
      date: {
        gte: sixMonthsAgo,
      },
      isRecurring: false, // Solo transacciones generadas, no templates
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
  
  // Inicializar últimos 6 meses usando UTC
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`
    const monthName = d.toLocaleDateString('es-CL', { month: 'short', timeZone: 'UTC' })
    monthlyData[key] = { 
      month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
      year: d.getUTCFullYear(),
      monthNum: d.getUTCMonth(),
      expenses: 0, 
      income: 0 
    }
  }

  // Sumar gastos por mes usando UTC
  expenses.forEach(exp => {
    const d = new Date(exp.date)
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`
    if (monthlyData[key]) {
      monthlyData[key].expenses += Number(exp.amount)
    }
  })

  // Sumar ingresos por mes usando UTC
  incomes.forEach(inc => {
    const d = new Date(inc.date)
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`
    if (monthlyData[key]) {
      monthlyData[key].income += Number(inc.amount)
    }
  })

  const monthlyTrend = Object.values(monthlyData)

  // Preparar datos por categoría (mes actual)
  // Usar UTC para evitar problemas de zona horaria
  const currentYear = now.getUTCFullYear()
  const currentMonth = now.getUTCMonth()
  const startOfMonth = new Date(Date.UTC(currentYear, currentMonth, 1))
  const endOfMonth = new Date(Date.UTC(currentYear, currentMonth + 1, 0, 23, 59, 59, 999))
  
  const currentMonthExpenses = expenses.filter(exp => {
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

  // Calcular totales del mes actual usando UTC
  const thisMonthExpenses = currentMonthExpenses.reduce((acc, exp) => acc + Number(exp.amount), 0)
  const filteredIncomes = incomes.filter(inc => {
    const incDate = new Date(inc.date)
    // Comparar usando UTC para evitar problemas de zona horaria
    const incYear = incDate.getUTCFullYear()
    const incMonth = incDate.getUTCMonth()
    const incDay = incDate.getUTCDate()
    const startYear = startOfMonth.getUTCFullYear()
    const startMonth = startOfMonth.getUTCMonth()
    const startDay = startOfMonth.getUTCDate()
    const endYear = endOfMonth.getUTCFullYear()
    const endMonth = endOfMonth.getUTCMonth()
    const endDay = endOfMonth.getUTCDate()
    
    // Verificar si la fecha está en el rango usando comparación UTC
    const isInRange = (
      incYear > startYear || 
      (incYear === startYear && incMonth > startMonth) ||
      (incYear === startYear && incMonth === startMonth && incDay >= startDay)
    ) && (
      incYear < endYear ||
      (incYear === endYear && incMonth < endMonth) ||
      (incYear === endYear && incMonth === endMonth && incDay <= endDay)
    )
    
    return isInRange
  })
  const thisMonthIncomes = filteredIncomes.reduce((acc, inc) => acc + Number(inc.amount), 0)

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
