'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  TrendingUp, 
  Plus, 
  Search, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Wallet,
  User,
  Users,
  Filter,
  ArrowUpRight,
  Repeat,
  Pause,
  Play,
  Edit3,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'
import { formatRecurrenceConfig, type RecurringConfig } from '@/lib/recurrence'
import IncomeForm from '@/components/IncomeForm'
import { createBrowserClient } from '@supabase/ssr'

interface Group {
  id: string
  name: string
  currency: string
}

interface Income {
  id: string
  amount: number
  description: string | null
  date: string
  isPersonal: boolean
  creator: {
    id: string
    name: string | null
    email: string
  }
}

interface RecurringTemplate extends Income {
  recurringConfig: RecurringConfig
}

interface MonthlyStats {
  total: number
  personal: number
  group: number
  count: number
  avgPerIncome: number
}

function formatCurrency(amount: number, currency: string = 'CLP') {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount)
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-CL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC', // Formatear en UTC para evitar conversión a hora local
  })
}

export default function IncomesPage() {
  const [incomes, setIncomes] = useState<Income[]>([])
  const [recurringTemplates, setRecurringTemplates] = useState<RecurringTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'personal' | 'group'>('all')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [groupId, setGroupId] = useState<string | null>(null)
  const [currency, setCurrency] = useState('CLP')
  const [stats, setStats] = useState<MonthlyStats>({
    total: 0,
    personal: 0,
    group: 0,
    count: 0,
    avgPerIncome: 0,
  })
  const [pausingTemplate, setPausingTemplate] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [incomeFormOpen, setIncomeFormOpen] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Obtener grupo activo
  useEffect(() => {
    async function fetchGroup() {
      try {
        // Obtener usuario actual
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setCurrentUserId(user.id)
        }

        // Obtener usuario (que incluye activeGroupId) y grupos
        const [userRes, groupsRes] = await Promise.all([
          fetch('/api/user'),
          fetch('/api/groups'),
        ])
        
        if (groupsRes.ok) {
          const groupsData = await groupsRes.json()
          if (groupsData.groups && groupsData.groups.length > 0) {
            let selectedGroup = groupsData.groups[0]
            
            // Si tenemos el usuario con activeGroupId, usarlo
            if (userRes.ok) {
              const userData = await userRes.json()
              if (userData.user?.activeGroupId) {
                const found = groupsData.groups.find((g: Group) => g.id === userData.user.activeGroupId)
                if (found) {
                  selectedGroup = found
                }
              } else {
                // Si no hay grupo activo guardado, guardar el primero
                await fetch('/api/user', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ activeGroupId: selectedGroup.id }),
                })
              }
            }
            
            setGroupId(selectedGroup.id)
            setCurrency(selectedGroup.currency || 'CLP')
          }
        }
      } catch (error) {
        console.error('Error fetching group:', error)
      }
    }
    fetchGroup()
  }, [])

  // Función para cargar ingresos (reutilizable)
  const fetchIncomes = useCallback(async () => {
    if (!groupId) return
    
    setLoading(true)
    try {
      const month = currentMonth.getMonth() + 1
      const year = currentMonth.getFullYear()
      const res = await fetch(`/api/incomes?groupId=${groupId}&month=${month}&year=${year}&includeRecurring=true`)
      
      if (res.ok) {
        const data = await res.json()
        setIncomes(data.incomes || [])
        setRecurringTemplates(data.recurringTemplates || [])
        
        // Calcular estadísticas
        const incomesData = data.incomes || []
        const total = incomesData.reduce((sum: number, inc: Income) => sum + Number(inc.amount), 0)
        const personal = incomesData
          .filter((inc: Income) => inc.isPersonal)
          .reduce((sum: number, inc: Income) => sum + Number(inc.amount), 0)
        const group = incomesData
          .filter((inc: Income) => !inc.isPersonal)
          .reduce((sum: number, inc: Income) => sum + Number(inc.amount), 0)
        
        setStats({
          total,
          personal,
          group,
          count: incomesData.length,
          avgPerIncome: incomesData.length > 0 ? total / incomesData.length : 0,
        })
      }
    } catch (error) {
      console.error('Error fetching incomes:', error)
    } finally {
      setLoading(false)
    }
  }, [groupId, currentMonth])

  // Pausar/Reanudar template recurrente
  const handleTogglePause = async (template: RecurringTemplate) => {
    setPausingTemplate(template.id)
    try {
      const config = template.recurringConfig
      const updatedConfig: RecurringConfig = {
        ...config,
        isPaused: !config.isPaused,
      }

      const res = await fetch(`/api/incomes/${template.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recurringConfig: updatedConfig,
        }),
      })

      if (res.ok) {
        fetchIncomes()
        toast.success(updatedConfig.isPaused ? 'Recurrencia pausada' : 'Recurrencia reanudada')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al actualizar recurrencia')
      }
    } catch (error) {
      console.error('Error toggling pause:', error)
      toast.error('Error al actualizar recurrencia')
    } finally {
      setPausingTemplate(null)
    }
  }

  // Eliminar template recurrente
  const handleDeleteTemplate = async (templateId: string) => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/incomes/${templateId}`, {
        method: 'DELETE',
      })
      
      if (res.ok) {
        fetchIncomes()
        setDeleteConfirm(null)
        toast.success('Recurrencia eliminada')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al eliminar recurrencia')
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      toast.error('Error al eliminar recurrencia')
    } finally {
      setDeleting(false)
    }
  }

  // Eliminar ingreso histórico
  const handleDeleteIncome = async (incomeId: string) => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/incomes/${incomeId}`, {
        method: 'DELETE',
      })
      
      if (res.ok) {
        fetchIncomes()
        setDeleteConfirm(null)
        toast.success('Ingreso eliminado')
      } else {
        const data = await res.json()
        toast.error(data.error || 'Error al eliminar ingreso')
      }
    } catch (error) {
      console.error('Error deleting income:', error)
      toast.error('Error al eliminar ingreso')
    } finally {
      setDeleting(false)
    }
  }

  // Cargar ingresos cuando cambia el grupo o el mes
  useEffect(() => {
    fetchIncomes()
  }, [fetchIncomes])

  // Escuchar evento para recargar ingresos (cuando se agrega uno nuevo desde el dashboard)
  useEffect(() => {
    const handleRefreshIncomes = () => {
      fetchIncomes()
    }
    window.addEventListener('refreshIncomes', handleRefreshIncomes)
    return () => window.removeEventListener('refreshIncomes', handleRefreshIncomes)
  }, [fetchIncomes])

  // Filtrar ingresos
  const filteredIncomes = incomes.filter(income => {
    const matchesSearch = !searchTerm || 
      income.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      income.creator.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      income.creator.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = filterType === 'all' || 
      (filterType === 'personal' && income.isPersonal) ||
      (filterType === 'group' && !income.isPersonal)
    
    return matchesSearch && matchesType
  })

  // Agrupar ingresos por día usando UTC para evitar conversión de zona horaria
  const groupedIncomes = filteredIncomes.reduce((groups, income) => {
    const incDate = new Date(income.date)
    // Crear clave usando año-mes-día en UTC para evitar problemas de zona horaria
    const dateKey = `${incDate.getUTCFullYear()}-${String(incDate.getUTCMonth() + 1).padStart(2, '0')}-${String(incDate.getUTCDate()).padStart(2, '0')}`
    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(income)
    return groups
  }, {} as Record<string, Income[]>)

  const sortedDates = Object.keys(groupedIncomes).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  )

  // Navegación de meses
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const monthName = currentMonth.toLocaleDateString('es-CL', { month: 'long', year: 'numeric', timeZone: 'UTC' })

  return (
    <>
      {/* Income Form Modal */}
      {groupId && (
        <IncomeForm
          open={incomeFormOpen}
          onOpenChange={setIncomeFormOpen}
          groupId={groupId}
          currency={currency}
          onSuccess={() => {
            fetchIncomes()
            toast.success('Ingreso agregado', {
              description: 'El ingreso se ha agregado correctamente',
            })
          }}
        />
      )}

      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Ingresos</h1>
          <p className="text-slate-400 text-sm mt-1">Historial y análisis de tus ingresos</p>
        </div>
        <button
          onClick={() => setIncomeFormOpen(true)}
          className="inline-flex items-center justify-center gap-2 gradient-primary text-white font-medium py-2.5 px-5 rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all"
        >
          <Plus className="w-5 h-5" />
          Nuevo ingreso
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm font-medium">Total mes</span>
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-emerald-400">
            {formatCurrency(stats.total, currency)}
          </p>
          <p className="text-xs text-slate-500 mt-1">{stats.count} ingresos</p>
        </div>

        <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm font-medium">Personales</span>
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <User className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-white">
            {formatCurrency(stats.personal, currency)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {stats.total > 0 ? ((stats.personal / stats.total) * 100).toFixed(0) : 0}% del total
          </p>
        </div>

        <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm font-medium">Grupales</span>
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Users className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-white">
            {formatCurrency(stats.group, currency)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {stats.total > 0 ? ((stats.group / stats.total) * 100).toFixed(0) : 0}% del total
          </p>
        </div>

        <div className="bg-slate-800/50 rounded-2xl p-5 border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-400 text-sm font-medium">Promedio</span>
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Wallet className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-white">
            {formatCurrency(stats.avgPerIncome, currency)}
          </p>
          <p className="text-xs text-slate-500 mt-1">por ingreso</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Month selector */}
        <div className="flex items-center gap-2 bg-slate-800/50 rounded-xl border border-slate-700 p-1">
          <button 
            onClick={goToPreviousMonth}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div className="flex items-center gap-2 px-3 min-w-[160px] justify-center">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-white font-medium capitalize">{monthName}</span>
          </div>
          <button 
            onClick={goToNextMonth}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar ingresos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Type filter */}
        <div className="flex items-center gap-1 bg-slate-800/50 rounded-xl border border-slate-700 p-1">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterType === 'all' 
                ? 'bg-emerald-500/20 text-emerald-400' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilterType('personal')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterType === 'personal' 
                ? 'bg-blue-500/20 text-blue-400' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            Personales
          </button>
          <button
            onClick={() => setFilterType('group')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterType === 'group' 
                ? 'bg-purple-500/20 text-purple-400' 
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            Grupales
          </button>
        </div>
      </div>

      {/* Recurring Templates Section */}
      {recurringTemplates.length > 0 && (
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Repeat className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-semibold text-white">Ingresos Recurrentes</h2>
              <span className="text-sm text-slate-500">({recurringTemplates.length})</span>
            </div>
          </div>
          <div className="space-y-3">
            {recurringTemplates.map(template => {
              const config = template.recurringConfig
              const isPaused = config?.isPaused || false
              return (
                <div
                  key={template.id}
                  className="bg-slate-900/50 rounded-xl border border-slate-700 p-4 hover:border-slate-600 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      template.isPersonal ? 'bg-blue-500/20' : 'bg-purple-500/20'
                    }`}>
                      {template.isPersonal ? (
                        <User className="w-6 h-6 text-blue-400" />
                      ) : (
                        <Users className="w-6 h-6 text-purple-400" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-medium">
                          {template.description || 'Ingreso recurrente'}
                        </p>
                        {isPaused && (
                          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                            Pausado
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                        <span>{formatCurrency(Number(template.amount), currency)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Repeat className="w-3 h-3" />
                          {formatRecurrenceConfig(config)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        {template.creator.name || template.creator.email.split('@')[0]}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTogglePause(template)}
                        disabled={pausingTemplate === template.id}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                        title={isPaused ? 'Reanudar' : 'Pausar'}
                      >
                        {pausingTemplate === template.id ? (
                          <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                        ) : isPaused ? (
                          <Play className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Pause className="w-4 h-4 text-amber-400" />
                        )}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(template.id)}
                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Income list */}
      <div className="space-y-6">
        {loading ? (
          <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto" />
            <p className="text-slate-400 mt-4">Cargando ingresos...</p>
          </div>
        ) : sortedDates.length === 0 ? (
          <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-slate-500" />
            </div>
            <p className="text-slate-400 mb-2">No hay ingresos registrados</p>
            <p className="text-slate-500 text-sm">
              {searchTerm || filterType !== 'all' 
                ? 'Prueba con otros filtros' 
                : 'Agrega tu primer ingreso del mes'}
            </p>
          </div>
        ) : (
          sortedDates.map(date => {
            const dayIncomes = groupedIncomes[date]
            const dayTotal = dayIncomes.reduce((sum, inc) => sum + Number(inc.amount), 0)
            
            return (
              <div key={date} className="space-y-3">
                {/* Day header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-slate-400">
                    {new Date(date).toLocaleDateString('es-CL', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long',
                      timeZone: 'UTC', // Formatear en UTC para evitar conversión a hora local
                    })}
                  </h3>
                  <span className="text-sm font-bold text-emerald-400">
                    +{formatCurrency(dayTotal, currency)}
                  </span>
                </div>

                {/* Incomes */}
                <div className="bg-slate-800/50 rounded-2xl border border-slate-700 divide-y divide-slate-700/50 overflow-hidden">
                  {dayIncomes.map(income => {
                    const isOwner = currentUserId === income.creator.id
                    return (
                      <div 
                        key={income.id}
                        className="p-4 hover:bg-slate-700/30 transition-colors group"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            income.isPersonal ? 'bg-blue-500/20' : 'bg-purple-500/20'
                          }`}>
                            {income.isPersonal ? (
                              <User className="w-5 h-5 text-blue-400" />
                            ) : (
                              <Users className="w-5 h-5 text-purple-400" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">
                              {income.description || 'Ingreso'}
                            </p>
                            <p className="text-sm text-slate-500">
                              {income.isPersonal ? 'Personal' : 'Grupal'} • {income.creator.name || income.creator.email.split('@')[0]}
                            </p>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-lg font-bold text-emerald-400">
                              +{formatCurrency(Number(income.amount), currency)}
                            </p>
                          </div>

                          {/* Actions (solo si es owner) */}
                          {isOwner && (
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => setDeleteConfirm(income.id)}
                                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Monthly summary */}
      {!loading && stats.count > 0 && (
        <div className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-2xl p-6 border border-emerald-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <ArrowUpRight className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Resumen del mes</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-emerald-400">{stats.count}</p>
              <p className="text-sm text-slate-400">ingresos registrados</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{formatCurrency(stats.total, currency)}</p>
              <p className="text-sm text-slate-400">total recibido</p>
            </div>
          </div>
          
          {/* Progress bar personal vs grupal */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-400 mb-2">
              <span>Personal ({((stats.personal / stats.total) * 100).toFixed(0)}%)</span>
              <span>Grupal ({((stats.group / stats.total) * 100).toFixed(0)}%)</span>
            </div>
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${(stats.personal / stats.total) * 100}%` }}
              />
              <div 
                className="h-full bg-purple-500 transition-all"
                style={{ width: `${(stats.group / stats.total) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-slate-900 rounded-2xl border border-slate-700 p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-white mb-2">
              {recurringTemplates.some(t => t.id === deleteConfirm)
                ? '¿Eliminar recurrencia?'
                : '¿Eliminar ingreso?'}
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              {recurringTemplates.some(t => t.id === deleteConfirm)
                ? 'Esto detendrá la generación de futuras transacciones. Las transacciones ya generadas no se eliminarán.'
                : 'Esta acción no se puede deshacer. El ingreso será eliminado permanentemente.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 text-slate-400 font-medium hover:bg-slate-800 transition-all"
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (recurringTemplates.some(t => t.id === deleteConfirm)) {
                    handleDeleteTemplate(deleteConfirm)
                  } else {
                    handleDeleteIncome(deleteConfirm)
                  }
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-all disabled:opacity-50"
                disabled={deleting}
              >
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}
