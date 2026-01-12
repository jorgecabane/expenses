'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight,
  Plus,
  ChevronRight,
  User,
  Users,
  Wallet,
  PiggyBank,
  RefreshCw,
  Info
} from 'lucide-react'
import ExpenseForm from './ExpenseForm'
import IncomeForm from './IncomeForm'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'

interface Pocket {
  id: string
  name: string
  emoji: string
  color: string
  spent: number
  limit: number
  isPersonal: boolean
  ownerId: string | null
  ownerName: string | null
  isOwner: boolean
  isReadOnly: boolean
}

interface Transaction {
  id: string
  description: string
  amount: number
  category: string
  emoji: string
  date: string
  creatorName: string
  isOwner: boolean
}

interface DashboardContentProps {
  groupId: string
  groupCurrency: string
  pockets: Pocket[]
  recentTransactions: Transaction[]
  totalSpent: number
  totalLimit: number
  totalIncome: number
  remainingBudget: number
  spentPercentage: number
  dailySuggested: number
  daysRemaining: number
  categories: Array<{
    id: string
    name: string
    icon: string | null
    color: string | null
    isPersonal: boolean
    ownerId: string | null
  }>
}

function getPocketStatus(spent: number, limit: number) {
  if (limit === 0) return { status: 'healthy', color: 'text-emerald-400', bgColor: 'bg-emerald-500', label: 'Todo bien' }
  const percentage = (spent / limit) * 100
  if (spent >= limit) return { status: 'critical', color: 'text-red-400', bgColor: 'bg-red-500', label: 'Límite excedido' }
  if (percentage >= 90) return { status: 'critical', color: 'text-red-400', bgColor: 'bg-red-500', label: '¡Casi al límite!' }
  if (percentage >= 70) return { status: 'warning', color: 'text-amber-400', bgColor: 'bg-amber-500', label: 'Ten cuidado' }
  return { status: 'healthy', color: 'text-emerald-400', bgColor: 'bg-emerald-500', label: 'Todo bien' }
}

function formatCurrency(amount: number, currency: string = 'CLP') {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount)
}

// Formato compacto para mobile: $4M, $45K, etc.
function formatCurrencyCompact(amount: number, currency: string = 'CLP') {
  const absAmount = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''
  const symbol = currency === 'CLP' ? '$' : currency === 'USD' ? 'US$' : '$'
  
  if (absAmount >= 1000000) {
    const millions = absAmount / 1000000
    return `${sign}${symbol}${millions.toFixed(millions >= 10 ? 0 : 1)}M`
  }
  if (absAmount >= 1000) {
    const thousands = absAmount / 1000
    return `${sign}${symbol}${thousands.toFixed(thousands >= 100 ? 0 : 0)}K`
  }
  return `${sign}${symbol}${absAmount.toFixed(0)}`
}

// Componente para mostrar moneda responsiva
function ResponsiveCurrency({ amount, currency = 'CLP', className = '' }: { amount: number; currency?: string; className?: string }) {
  return (
    <>
      {/* Mobile: formato compacto */}
      <span className={`sm:hidden ${className}`}>
        {formatCurrencyCompact(amount, currency)}
      </span>
      {/* Desktop: formato completo */}
      <span className={`hidden sm:inline ${className}`}>
        {formatCurrency(amount, currency)}
      </span>
    </>
  )
}

export default function DashboardContent({
  groupId,
  groupCurrency,
  pockets: initialPockets,
  recentTransactions: initialTransactions,
  totalSpent: initialTotalSpent,
  totalLimit,
  totalIncome: initialTotalIncome,
  remainingBudget: initialRemainingBudget,
  spentPercentage: initialSpentPercentage,
  dailySuggested: initialDailySuggested,
  daysRemaining,
  categories,
}: DashboardContentProps) {
  // Estado local para datos que pueden cambiar
  const [pockets, setPockets] = useState(initialPockets)
  const [recentTransactions, setRecentTransactions] = useState(initialTransactions)
  const [totalSpent, setTotalSpent] = useState(initialTotalSpent)
  const [totalIncome, setTotalIncome] = useState(initialTotalIncome)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const [expenseFormOpen, setExpenseFormOpen] = useState(false)
  const [incomeFormOpen, setIncomeFormOpen] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>()
  const [dailySuggestedModalOpen, setDailySuggestedModalOpen] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Actualizar estado cuando cambian los props (especialmente cuando cambia groupId)
  useEffect(() => {
    setPockets(initialPockets)
    setRecentTransactions(initialTransactions)
    setTotalSpent(initialTotalSpent)
    setTotalIncome(initialTotalIncome)
  }, [groupId, initialPockets, initialTransactions, initialTotalSpent, initialTotalIncome])
  
  // Calcular valores derivados
  const remainingBudget = totalLimit - totalSpent
  const spentPercentage = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0
  const dailySuggested = daysRemaining > 0 ? Math.round(remainingBudget / daysRemaining) : 0
  const balance = totalIncome - totalSpent
  const incomeUsedPercentage = totalIncome > 0 ? (totalSpent / totalIncome) * 100 : 0
  
  // Calcular diario sugerido basado en ingresos (si existen)
  const remainingIncome = totalIncome - totalSpent
  const dailySuggestedByIncome = daysRemaining > 0 && totalIncome > 0 
    ? Math.round(remainingIncome / daysRemaining) 
    : null

  // Función para refrescar datos sin recargar la página
  const refreshData = useCallback(async () => {
    setIsRefreshing(true)
    try {
      // Obtener datos actualizados
      const [expensesRes, incomesRes] = await Promise.all([
        fetch(`/api/expenses?groupId=${groupId}&limit=10`),
        fetch(`/api/incomes?groupId=${groupId}`),
      ])

      if (expensesRes.ok) {
        const { expenses } = await expensesRes.json()
        
        // Actualizar transacciones recientes
        const newTransactions = expenses.slice(0, 5).map((exp: any) => ({
          id: exp.id,
          description: exp.description || 'Sin descripción',
          amount: Number(exp.amount),
          category: exp.category?.name || 'Sin categoría',
          emoji: exp.category?.icon || '📁',
          date: formatRelativeDate(new Date(exp.date)),
          creatorName: exp.creator?.name || exp.creator?.email?.split('@')[0] || 'Usuario',
          isOwner: true, // Simplificado por ahora
        }))
        setRecentTransactions(newTransactions)
        
        // Calcular nuevo total gastado
        const newTotalSpent = expenses.reduce((acc: number, exp: any) => acc + Number(exp.amount), 0)
        setTotalSpent(newTotalSpent)
        
        // Actualizar gastos por categoría en pockets
        const expensesByCategory: Record<string, number> = {}
        expenses.forEach((exp: any) => {
          expensesByCategory[exp.categoryId] = (expensesByCategory[exp.categoryId] || 0) + Number(exp.amount)
        })
        
        setPockets(prev => prev.map(pocket => ({
          ...pocket,
          spent: expensesByCategory[pocket.id] || 0,
        })))
      }

      if (incomesRes.ok) {
        const { incomes } = await incomesRes.json()
        const newTotalIncome = incomes.reduce((acc: number, inc: any) => acc + Number(inc.amount), 0)
        setTotalIncome(newTotalIncome)
      }
    } catch (error) {
      console.error('Error refreshing data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }, [groupId])

  // Helper para formatear fecha relativa
  function formatRelativeDate(date: Date): string {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return 'Hoy'
    if (days === 1) return 'Ayer'
    if (days < 7) return `Hace ${days} días`
    return date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
  }

  // Abrir modal si viene con ?new=true
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setExpenseFormOpen(true)
      // Limpiar el query param sin recargar
      router.replace('/dashboard', { scroll: false })
    }
  }, [searchParams, router])

  // Escuchar evento global para abrir el modal
  useEffect(() => {
    const handleOpenExpenseForm = () => {
      setExpenseFormOpen(true)
    }
    window.addEventListener('openExpenseForm', handleOpenExpenseForm)
    return () => window.removeEventListener('openExpenseForm', handleOpenExpenseForm)
  }, [])

  const openExpenseForm = (categoryId?: string) => {
    setSelectedCategoryId(categoryId)
    setExpenseFormOpen(true)
  }

  return (
    <>
      {/* Expense Form Modal */}
      <ExpenseForm
        open={expenseFormOpen}
        onOpenChange={setExpenseFormOpen}
        groupId={groupId}
        categories={categories}
        defaultCategoryId={selectedCategoryId}
        currency={groupCurrency}
        onSuccess={refreshData}
      />

      {/* Income Form Modal */}
      <IncomeForm
        open={incomeFormOpen}
        onOpenChange={setIncomeFormOpen}
        groupId={groupId}
        currency={groupCurrency}
        onSuccess={() => {
          refreshData()
          // Disparar evento para recargar la página de ingresos si está abierta
          window.dispatchEvent(new CustomEvent('refreshIncomes'))
        }}
      />

      {/* Daily Suggested Info Modal */}
      <Dialog open={dailySuggestedModalOpen} onOpenChange={setDailySuggestedModalOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-700 flex-shrink-0">
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <PiggyBank className="w-5 h-5 text-emerald-400" />
              Diario sugerido
            </DialogTitle>
            <DialogDescription className="text-slate-400 mt-1">
              Cálculo basado en tu presupuesto y días restantes del mes
            </DialogDescription>
          </DialogHeader>
          
          <div className="px-6 py-4 space-y-6 overflow-y-auto flex-1">
            {/* Cálculo basado en presupuesto */}
            <div className="bg-slate-700/50 rounded-xl p-4 border border-slate-600">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-300">Según Presupuesto</h3>
                <span className="text-xs text-slate-500">Basado en bolsillos</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Presupuesto mensual:</span>
                  <span className="text-white font-medium">{formatCurrency(totalLimit, groupCurrency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Gastado este mes:</span>
                  <span className="text-red-400 font-medium">-{formatCurrency(totalSpent, groupCurrency)}</span>
                </div>
                <div className="border-t border-slate-600 pt-2 mt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Restante:</span>
                    <span className="text-emerald-400 font-medium">{formatCurrency(remainingBudget, groupCurrency)}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-slate-400">Días restantes:</span>
                    <span className="text-white font-medium">{daysRemaining}</span>
                  </div>
                </div>
                <div className="border-t border-emerald-500/30 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-emerald-400 font-semibold">Diario sugerido:</span>
                    <span className="text-2xl font-bold text-emerald-400">
                      {formatCurrency(dailySuggested, groupCurrency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cálculo basado en ingresos (si existen) */}
            {totalIncome > 0 && (
              <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/30">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-blue-300">Según Ingresos</h3>
                  <span className="text-xs text-blue-400/70">Alternativa</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Ingresos del mes:</span>
                    <span className="text-white font-medium">{formatCurrency(totalIncome, groupCurrency)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Gastado este mes:</span>
                    <span className="text-red-400 font-medium">-{formatCurrency(totalSpent, groupCurrency)}</span>
                  </div>
                  <div className="border-t border-blue-500/30 pt-2 mt-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Restante:</span>
                      <span className="text-blue-400 font-medium">{formatCurrency(remainingIncome, groupCurrency)}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-slate-400">Días restantes:</span>
                      <span className="text-white font-medium">{daysRemaining}</span>
                    </div>
                  </div>
                  <div className="border-t border-blue-500/30 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-blue-400 font-semibold">Diario sugerido:</span>
                      <span className="text-2xl font-bold text-blue-400">
                        {dailySuggestedByIncome !== null ? formatCurrency(dailySuggestedByIncome, groupCurrency) : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Nota informativa */}
            {totalIncome === 0 && (
              <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/50">
                <p className="text-xs text-slate-400 text-center">
                  💡 Registra ingresos para ver una sugerencia alternativa basada en tus ingresos reales
                </p>
              </div>
            )}

            {/* Diferencia si ambos existen */}
            {totalIncome > 0 && dailySuggestedByIncome !== null && (
              <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-600/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Diferencia:</span>
                  <span className={`text-sm font-semibold ${
                    Math.abs(dailySuggested - dailySuggestedByIncome) < dailySuggested * 0.1
                      ? 'text-emerald-400'
                      : dailySuggestedByIncome > dailySuggested
                        ? 'text-blue-400'
                        : 'text-amber-400'
                  }`}>
                    {dailySuggestedByIncome > dailySuggested ? '+' : ''}
                    {formatCurrency(dailySuggestedByIncome - dailySuggested, groupCurrency)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 text-center">
                  {dailySuggestedByIncome > dailySuggested 
                    ? 'Tienes más margen según tus ingresos' 
                    : dailySuggestedByIncome < dailySuggested
                      ? 'Tu presupuesto es más conservador que tus ingresos'
                      : 'Ambos cálculos coinciden'}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-8">
        {/* Header with stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Ingresos */}
          <button 
            onClick={() => setIncomeFormOpen(true)}
            className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700 hover:border-emerald-500/50 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-400 text-sm font-medium">Ingresos</span>
              <div className="p-2 bg-emerald-500/20 rounded-lg group-hover:bg-emerald-500/30 transition-colors">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-emerald-400">
              <ResponsiveCurrency amount={totalIncome} currency={groupCurrency} />
            </p>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <Plus className="w-3 h-3" /> Agregar ingreso
            </p>
          </button>

          {/* Total gastado */}
          <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-400 text-sm font-medium">Gastado</span>
              <div className="p-2 bg-red-500/20 rounded-lg">
                <TrendingDown className="w-4 h-4 text-red-400" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-white">
              <ResponsiveCurrency amount={totalSpent} currency={groupCurrency} />
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {incomeUsedPercentage.toFixed(0)}% del ingreso
            </p>
          </div>

          {/* Balance */}
          <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-400 text-sm font-medium">Balance</span>
              <div className={`p-2 rounded-lg ${balance >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                <Wallet className={`w-4 h-4 ${balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`} />
              </div>
            </div>
            <p className={`text-xl sm:text-2xl font-bold ${balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              <ResponsiveCurrency amount={balance} currency={groupCurrency} />
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {balance >= 0 ? 'Disponible' : 'En déficit'}
            </p>
          </div>

          {/* Sugerencia diaria */}
          <button
            onClick={() => setDailySuggestedModalOpen(true)}
            className="bg-gradient-to-br from-emerald-500/20 to-purple-500/20 rounded-2xl p-5 border border-emerald-500/30 hover:border-emerald-500/50 transition-all text-left w-full group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-300 text-sm font-medium">Diario sugerido</span>
              <div className="p-2 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
                <PiggyBank className="w-4 h-4 text-white" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-white">
              <ResponsiveCurrency amount={dailySuggested} currency={groupCurrency} />
            </p>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <Info className="w-3 h-3" />
              {daysRemaining} días restantes
            </p>
          </button>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pockets */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-xl font-bold text-white">Mis bolsillos</h2>
                {totalLimit > 0 && (
                  <p className="text-sm text-slate-400 mt-0.5">
                    Presupuesto mensual: <span className="text-emerald-400 font-semibold">{formatCurrency(totalLimit, groupCurrency)}</span>
                  </p>
                )}
              </div>
              <Link 
                href="/dashboard/pockets/new" 
                className="flex items-center gap-2 text-emerald-400 text-sm font-medium hover:text-emerald-300 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nuevo bolsillo
              </Link>
            </div>
            
            {pockets.length === 0 ? (
              <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700 text-center">
                <p className="text-slate-400">No tienes bolsillos configurados</p>
                <Link 
                  href="/dashboard/setup"
                  className="inline-flex items-center gap-2 text-emerald-400 text-sm font-medium mt-4 hover:text-emerald-300 transition-colors"
                >
                  Configurar bolsillos
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pockets.map((pocket) => {
                  const percentage = pocket.limit > 0 ? (pocket.spent / pocket.limit) * 100 : 0
                  const { color, bgColor, label } = getPocketStatus(pocket.spent, pocket.limit || 1)
                  
                  return (
                    <div 
                      key={pocket.id}
                      onClick={() => !pocket.isReadOnly && openExpenseForm(pocket.id)}
                      className={`bg-slate-800/50 rounded-2xl p-5 border transition-all group ${
                        pocket.isReadOnly 
                          ? 'border-dashed border-slate-600 opacity-80 cursor-default' 
                          : 'border-slate-700 hover:border-emerald-500/50 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center text-2xl">
                            {pocket.emoji}
                          </div>
                          <div>
                            <h3 className="text-white font-medium">{pocket.name}</h3>
                            <p className={`text-sm ${color}`}>
                              {pocket.limit > 0 ? label : 'Sin límite'}
                            </p>
                            {/* Indicador de tipo */}
                            <div className="flex items-center gap-1.5 mt-1">
                              {pocket.isPersonal ? (
                                <>
                                  <User className="w-3 h-3 text-slate-500" />
                                  <span className="text-xs text-slate-500">
                                    {pocket.isOwner ? 'Mío' : pocket.ownerName}
                                  </span>
                                  {pocket.isReadOnly && (
                                    <span className="text-xs text-slate-600 ml-1">(solo ver)</span>
                                  )}
                                </>
                              ) : (
                                <>
                                  <Users className="w-3 h-3 text-slate-500" />
                                  <span className="text-xs text-slate-500">Grupal</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        {!pocket.isReadOnly && (
                          <Plus className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 transition-colors" />
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-end justify-between">
                          <span className="text-2xl font-bold text-white">
                            {formatCurrency(pocket.spent, groupCurrency)}
                          </span>
                          {pocket.limit > 0 && (
                            <span className="text-sm text-slate-500">
                              de {formatCurrency(pocket.limit, groupCurrency)}
                            </span>
                          )}
                        </div>
                        
                        {pocket.limit > 0 && (
                          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${bgColor} rounded-full transition-all`}
                              style={{ width: `${Math.min(percentage, 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          
          {/* Recent transactions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Últimos gastos</h2>
              <Link 
                href="/dashboard/expenses" 
                className="text-emerald-400 text-sm font-medium hover:text-emerald-300 transition-colors"
              >
                Ver todos
              </Link>
            </div>
            
            {recentTransactions.length === 0 ? (
              <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700 text-center">
                <p className="text-slate-400">No tienes gastos registrados</p>
              </div>
            ) : (
              <div className="bg-slate-800/50 rounded-2xl border border-slate-700 divide-y divide-slate-700">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="p-4 hover:bg-slate-700/50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center text-lg">
                        {tx.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{tx.description}</p>
                        <p className="text-sm text-slate-500">
                          {tx.category} • {tx.date} • <span className={tx.isOwner ? 'text-emerald-500' : 'text-slate-400'}>{tx.isOwner ? 'Mío' : tx.creatorName}</span>
                        </p>
                      </div>
                      <div className="text-red-400 font-semibold">
                        -{formatCurrency(tx.amount, groupCurrency)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Quick add button */}
            <button 
              onClick={() => openExpenseForm()}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed border-slate-700 text-slate-500 hover:border-emerald-500 hover:text-emerald-400 transition-all"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Agregar gasto</span>
            </button>
          </div>
        </div>
        
        {/* Progress overview */}
        {totalLimit > 0 && (
          <div className="bg-gradient-to-br from-emerald-500/30 to-purple-500/30 rounded-2xl p-6 border border-emerald-500/20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">
                  {spentPercentage < 50 
                    ? 'Vas muy bien este mes 🎉' 
                    : spentPercentage < 80 
                      ? 'Buen progreso, sigue así 💪'
                      : 'Cuidado con tu presupuesto ⚠️'}
                </h3>
                <p className="text-slate-300">
                  Has usado el {spentPercentage.toFixed(0)}% de tu presupuesto y quedan {daysRemaining} días.
                </p>
              </div>
              <Link 
                href="/dashboard/reports"
                className="gradient-primary text-white font-semibold px-6 py-3 rounded-xl transition-all whitespace-nowrap"
              >
                Ver reporte completo
              </Link>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
