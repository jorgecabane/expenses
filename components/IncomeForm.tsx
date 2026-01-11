'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { X, TrendingUp, Loader2, Check, Calendar, User, Users, Repeat } from 'lucide-react'
import RecurrenceModal from './RecurrenceModal'
import { type RecurringConfig, formatRecurrenceConfig } from '@/lib/recurrence'

interface IncomeFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string
  currency?: string
  onSuccess?: () => void
}

export default function IncomeForm({
  open,
  onOpenChange,
  groupId,
  currency = 'CLP',
  onSuccess,
}: IncomeFormProps) {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [type, setType] = useState<'personal' | 'group'>('group')
  const [recurringConfig, setRecurringConfig] = useState<RecurringConfig | null>(null)
  const [showRecurrenceModal, setShowRecurrenceModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Reset cuando se cierra
  useEffect(() => {
    if (!open) {
      setAmount('')
      setDescription('')
      setDate(new Date().toISOString().split('T')[0])
      setType('group')
      setRecurringConfig(null)
      setShowRecurrenceModal(false)
      setError(null)
      setSuccess(false)
    }
  }, [open])

  // Cerrar con Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, onOpenChange])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/incomes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          amount: parseFloat(amount),
          description: description || null,
          // Enviar solo la fecha en formato YYYY-MM-DD para evitar problemas UTC
          date: date,
          type,
          isRecurring: !!recurringConfig,
          recurringConfig: recurringConfig || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al registrar ingreso')
        toast.error('Error al registrar ingreso', { description: data.error })
        setLoading(false)
        return
      }

      setSuccess(true)
      toast.success('Ingreso registrado', { 
        description: `$${parseFloat(amount).toLocaleString('es-CL')} agregado`
      })
      setTimeout(() => {
        onOpenChange(false)
        onSuccess?.()
      }, 800)
    } catch {
      setError('Error al registrar ingreso')
      toast.error('Error al registrar ingreso')
      setLoading(false)
    }
  }

  const formatDisplayAmount = (value: string) => {
    if (!value) return ''
    const num = parseFloat(value)
    if (isNaN(num)) return value
    return new Intl.NumberFormat('es-CL').format(num)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Success overlay */}
        {success && (
          <div className="absolute inset-0 z-10 bg-slate-900/95 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <p className="text-white font-semibold text-lg">¡Ingreso registrado!</p>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Nuevo ingreso</h2>
              <p className="text-sm text-slate-500">Registra tu ingreso mensual</p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form - Scrollable */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Monto */}
          <div className="text-center py-4">
            <label className="text-sm text-slate-500 mb-2 block">Monto</label>
            <div className="relative inline-flex items-center">
              <span className="text-3xl text-slate-500 mr-2">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="text-5xl font-bold text-emerald-400 bg-transparent border-none outline-none text-center w-48 placeholder-slate-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                autoFocus
                required
              />
            </div>
            {amount && (
              <p className="text-slate-500 text-sm mt-1">
                {formatDisplayAmount(amount)} {currency}
              </p>
            )}
          </div>

          {/* Tipo de ingreso */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Tipo de ingreso</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('group')}
                className={`flex items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
                  type === 'group'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <Users className="w-5 h-5" />
                <span className="font-medium">Grupal</span>
              </button>
              <button
                type="button"
                onClick={() => setType('personal')}
                className={`flex items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
                  type === 'personal'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <User className="w-5 h-5" />
                <span className="font-medium">Personal</span>
              </button>
            </div>
            <p className="text-xs text-slate-500">
              {type === 'group' 
                ? 'Ingreso compartido para todo el grupo'
                : 'Tu ingreso personal dentro del grupo'}
            </p>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Descripción</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Sueldo, freelance, regalo..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
          </div>

          {/* Fecha */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Fecha</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
          </div>

          {/* Recurrencia */}
          <div className="space-y-2">
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm font-medium text-slate-400 group-hover:text-slate-300 transition-colors">
                ¿Es recurrente?
              </span>
              <button
                type="button"
                onClick={() => {
                  if (!recurringConfig) {
                    setShowRecurrenceModal(true)
                  } else {
                    setRecurringConfig(null)
                  }
                }}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  recurringConfig
                    ? 'bg-emerald-500'
                    : 'bg-slate-700'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                    recurringConfig ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </label>
            {recurringConfig && (
              <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 mb-1">Recurrencia configurada</p>
                    <p className="text-sm text-white font-medium">
                      {formatRecurrenceConfig(recurringConfig)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowRecurrenceModal(true)}
                    className="ml-3 p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors"
                    title="Editar recurrencia"
                  >
                    <Repeat className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-700 text-slate-400 font-medium hover:bg-slate-800 hover:text-white transition-all"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !amount}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar ingreso'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Modal de recurrencia */}
      <RecurrenceModal
        open={showRecurrenceModal}
        onOpenChange={setShowRecurrenceModal}
        selectedDate={(() => {
          // Parsear la fecha en formato YYYY-MM-DD y crear Date en hora local
          const [year, month, day] = date.split('-').map(Number)
          return new Date(year, month - 1, day)
        })()}
        value={recurringConfig}
        onSave={(config) => {
          setRecurringConfig(config)
        }}
        isEdit={!!recurringConfig}
      />
    </div>
  )
}
