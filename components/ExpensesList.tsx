'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Search, 
  Filter, 
  Calendar,
  ChevronDown,
  User,
  Users,
  Trash2,
  Edit3,
  Plus,
  X,
  MoreVertical,
  TrendingDown
} from 'lucide-react'
import ExpenseForm from './ExpenseForm'

interface Expense {
  id: string
  amount: number
  description: string
  date: string
  categoryId: string
  categoryName: string
  categoryIcon: string
  categoryColor: string
  isPersonal: boolean
  creatorId: string
  creatorName: string
  isOwner: boolean
}

interface Category {
  id: string
  name: string
  icon: string | null
  color: string | null
  isPersonal: boolean
  ownerId: string | null
}

interface ExpensesListProps {
  expenses: Expense[]
  categories: Category[]
  groupId: string
  groupCurrency: string
  totalExpenses: number
  thisMonthTotal: number
  currentUserId: string
}

function formatCurrency(amount: number, currency: string = 'CLP') {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-CL', { 
    day: 'numeric', 
    month: 'short',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  })
}

function formatFullDate(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-CL', { 
    weekday: 'long',
    day: 'numeric', 
    month: 'long',
    year: 'numeric'
  })
}

export default function ExpensesList({
  expenses,
  categories,
  groupId,
  groupCurrency,
  totalExpenses,
  thisMonthTotal,
  currentUserId,
}: ExpensesListProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [dateRange, setDateRange] = useState<'week' | 'month' | '3months' | 'all'>('month')
  const [showFilters, setShowFilters] = useState(false)
  const [expenseFormOpen, setExpenseFormOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Filtrar gastos
  const filteredExpenses = useMemo(() => {
    let result = [...expenses]

    // Filtro por búsqueda
    if (search) {
      const searchLower = search.toLowerCase()
      result = result.filter(exp => 
        exp.description.toLowerCase().includes(searchLower) ||
        exp.categoryName.toLowerCase().includes(searchLower)
      )
    }

    // Filtro por categoría
    if (selectedCategory !== 'all') {
      result = result.filter(exp => exp.categoryId === selectedCategory)
    }

    // Filtro por rango de fecha
    const now = new Date()
    let startDate: Date | null = null

    switch (dateRange) {
      case 'week':
        startDate = new Date(now)
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case '3months':
        startDate = new Date(now)
        startDate.setMonth(now.getMonth() - 3)
        break
    }

    if (startDate) {
      result = result.filter(exp => new Date(exp.date) >= startDate!)
    }

    return result
  }, [expenses, search, selectedCategory, dateRange])

  // Agrupar por fecha
  const groupedExpenses = useMemo(() => {
    const groups: Record<string, Expense[]> = {}
    
    filteredExpenses.forEach(exp => {
      const dateKey = new Date(exp.date).toISOString().split('T')[0]
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(exp)
    })

    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, items]) => ({
        date,
        items,
        total: items.reduce((acc, exp) => acc + exp.amount, 0)
      }))
  }, [filteredExpenses])

  // Calcular total filtrado
  const filteredTotal = filteredExpenses.reduce((acc, exp) => acc + exp.amount, 0)

  // Eliminar gasto
  const handleDelete = async (expenseId: string) => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/expenses/${expenseId}`, {
        method: 'DELETE',
      })
      
      if (res.ok) {
        router.refresh()
        setDeleteConfirm(null)
      }
    } catch (error) {
      console.error('Error deleting expense:', error)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      {/* Expense Form Modal */}
      <ExpenseForm
        open={expenseFormOpen}
        onOpenChange={setExpenseFormOpen}
        groupId={groupId}
        categories={categories}
        currency={groupCurrency}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-slate-900 rounded-2xl border border-slate-700 p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-white mb-2">¿Eliminar gasto?</h3>
            <p className="text-slate-400 text-sm mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 text-slate-400 font-medium hover:bg-slate-800 transition-all"
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-all disabled:opacity-50"
                disabled={deleting}
              >
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Gastos</h1>
            <p className="text-slate-400">
              {filteredExpenses.length} gastos • {formatCurrency(filteredTotal, groupCurrency)}
            </p>
          </div>
          <button
            onClick={() => setExpenseFormOpen(true)}
            className="flex items-center justify-center gap-2 gradient-primary text-white font-medium py-3 px-5 rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>Nuevo gasto</span>
          </button>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <p className="text-sm text-slate-400 mb-1">Este mes</p>
            <p className="text-xl font-bold text-white">{formatCurrency(thisMonthTotal, groupCurrency)}</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <p className="text-sm text-slate-400 mb-1">Últimos 3 meses</p>
            <p className="text-xl font-bold text-white">{formatCurrency(totalExpenses, groupCurrency)}</p>
          </div>
        </div>

        {/* Search and filters */}
        <div className="space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar gastos..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter toggles */}
          <div className="flex flex-wrap gap-2">
            {/* Date range */}
            <div className="flex rounded-xl bg-slate-800 border border-slate-700 p-1">
              {[
                { value: 'week', label: '7 días' },
                { value: 'month', label: 'Este mes' },
                { value: '3months', label: '3 meses' },
                { value: 'all', label: 'Todo' },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setDateRange(option.value as typeof dateRange)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    dateRange === option.value
                      ? 'bg-emerald-500 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Category filter */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                selectedCategory !== 'all'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">
                {selectedCategory === 'all' 
                  ? 'Bolsillo' 
                  : categories.find(c => c.id === selectedCategory)?.name || 'Bolsillo'}
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Category dropdown */}
          {showFilters && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                onClick={() => { setSelectedCategory('all'); setShowFilters(false) }}
                className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span className="text-lg">📊</span>
                <span className="text-sm font-medium">Todos</span>
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategory(cat.id); setShowFilters(false) }}
                  className={`flex items-center gap-2 p-2 rounded-lg transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <span className="text-lg">{cat.icon || '📁'}</span>
                  <span className="text-sm font-medium truncate">{cat.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Expenses list */}
        {groupedExpenses.length === 0 ? (
          <div className="bg-slate-800/50 rounded-2xl p-12 border border-slate-700 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-700 flex items-center justify-center mx-auto mb-4">
              <TrendingDown className="w-8 h-8 text-slate-500" />
            </div>
            <p className="text-slate-400 mb-2">No hay gastos</p>
            <p className="text-sm text-slate-500">
              {search || selectedCategory !== 'all' 
                ? 'Prueba ajustando los filtros' 
                : 'Registra tu primer gasto para empezar'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedExpenses.map(group => (
              <div key={group.date}>
                {/* Date header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-400">
                      {formatFullDate(group.date)}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-red-400">
                    -{formatCurrency(group.total, groupCurrency)}
                  </span>
                </div>

                {/* Expenses for this date */}
                <div className="bg-slate-800/50 rounded-xl border border-slate-700 divide-y divide-slate-700">
                  {group.items.map(expense => (
                    <div 
                      key={expense.id} 
                      className="p-4 hover:bg-slate-700/30 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        {/* Icon */}
                        <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center text-xl flex-shrink-0">
                          {expense.categoryIcon}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-white font-medium truncate">
                              {expense.description || expense.categoryName}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-sm text-slate-500">{expense.categoryName}</span>
                            <span className="text-slate-600">•</span>
                            {expense.isPersonal ? (
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {expense.isOwner ? 'Mío' : expense.creatorName}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {expense.creatorName}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="text-right">
                          <p className="text-red-400 font-semibold">
                            -{formatCurrency(expense.amount, groupCurrency)}
                          </p>
                        </div>

                        {/* Actions (solo si es owner) */}
                        {expense.isOwner && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => setDeleteConfirm(expense.id)}
                              className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
