'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { X, Receipt, User, Users, Loader2, Check, Minus, Calendar } from 'lucide-react'

interface Category {
  id: string
  name: string
  icon: string | null
  color: string | null
  isPersonal: boolean
  ownerId: string | null
}

interface ExpenseFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groupId: string
  categories: Category[]
  defaultCategoryId?: string
  currency?: string
  onSuccess?: () => void
}

export default function ExpenseForm({
  open,
  onOpenChange,
  groupId,
  categories,
  defaultCategoryId,
  currency = 'CLP',
  onSuccess,
}: ExpenseFormProps) {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState(defaultCategoryId || '')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const selectedCategory = categories.find((c) => c.id === categoryId)

  // Separar categorías
  const sharedCategories = categories.filter((c) => !c.isPersonal)
  const personalCategories = categories.filter((c) => c.isPersonal)

  useEffect(() => {
    if (defaultCategoryId) {
      setCategoryId(defaultCategoryId)
    }
  }, [defaultCategoryId])

  // Reset cuando se cierra
  useEffect(() => {
    if (!open) {
      setAmount('')
      setDescription('')
      setCategoryId(defaultCategoryId || '')
      setDate(new Date().toISOString().split('T')[0])
      setError(null)
      setSuccess(false)
    }
  }, [open, defaultCategoryId])

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
    if (!categoryId || !amount) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          categoryId,
          amount: parseFloat(amount),
          description: description || null,
          date: new Date(date).toISOString(),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al crear gasto')
        toast.error('Error al crear gasto', { description: data.error })
        setLoading(false)
        return
      }

      setSuccess(true)
      toast.success('Gasto registrado', { 
        description: `$${amount.toLocaleString('es-CL')} en ${categories.find(c => c.id === categoryId)?.name}`
      })
      setTimeout(() => {
        onOpenChange(false)
        onSuccess?.()
      }, 800)
    } catch {
      setError('Error al crear gasto')
      setLoading(false)
    }
  }

  // Formatear el monto mientras escribe
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
      <div className="relative w-full max-w-md mx-4 bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
        {/* Success overlay */}
        {success && (
          <div className="absolute inset-0 z-10 bg-slate-900/95 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <p className="text-white font-semibold text-lg">¡Gasto registrado!</p>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <Minus className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Nuevo gasto</h2>
              <p className="text-sm text-slate-500">Registra tu gasto</p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Monto - Input grande y prominente */}
          <div className="text-center py-4">
            <label className="text-sm text-slate-500 mb-2 block">Monto</label>
            <div className="relative inline-flex items-center">
              <span className="text-3xl text-slate-500 mr-2">$</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="text-5xl font-bold text-white bg-transparent border-none outline-none text-center w-48 placeholder-slate-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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

          {/* Bolsillo selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Bolsillo</label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
              {/* Compartidos */}
              {sharedCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-left ${
                    categoryId === cat.id
                      ? 'bg-emerald-500/20 border-emerald-500 ring-2 ring-emerald-500/30'
                      : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <span className="text-xl">{cat.icon || '📁'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{cat.name}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Users className="w-3 h-3" /> Grupal
                    </p>
                  </div>
                </button>
              ))}
              {/* Personales */}
              {personalCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-left ${
                    categoryId === cat.id
                      ? 'bg-emerald-500/20 border-emerald-500 ring-2 ring-emerald-500/30'
                      : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <span className="text-xl">{cat.icon || '📁'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{cat.name}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <User className="w-3 h-3" /> Personal
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Descripción</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Supermercado, café, etc."
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
              disabled={loading || !amount || !categoryId}
              className="flex-1 py-3 px-4 rounded-xl gradient-primary text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar gasto'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
