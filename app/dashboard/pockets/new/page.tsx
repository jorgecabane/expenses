'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  Wallet, 
  ArrowLeft,
  ArrowRight,
  Check,
  Sparkles,
  Lock,
  Users
} from 'lucide-react'

// Emojis sugeridos (acceso rápido)
const suggestedEmojis = [
  '🍕', '🚗', '🎬', '💊', '💡', '🛍️', '✈️', '📚', 
  '🐷', '🎁', '💪', '📱', '🏠', '☕', '🎮', '🎧'
]

// Colores disponibles
const availableColors = [
  { name: 'Esmeralda', value: 'bg-emerald-500', hex: '#10B981' },
  { name: 'Azul', value: 'bg-blue-500', hex: '#3B82F6' },
  { name: 'Púrpura', value: 'bg-purple-500', hex: '#A855F7' },
  { name: 'Rosa', value: 'bg-pink-500', hex: '#EC4899' },
  { name: 'Rojo', value: 'bg-red-500', hex: '#EF4444' },
  { name: 'Naranja', value: 'bg-orange-500', hex: '#F97316' },
  { name: 'Amarillo', value: 'bg-amber-500', hex: '#F59E0B' },
  { name: 'Cyan', value: 'bg-cyan-500', hex: '#06B6D4' },
  { name: 'Indigo', value: 'bg-indigo-500', hex: '#6366F1' },
  { name: 'Slate', value: 'bg-slate-500', hex: '#64748B' },
]

interface PocketData {
  name: string
  emoji: string
  color: string
  monthlyLimit: number
  isPersonal: boolean
}

export default function NewPocketPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [groupId, setGroupId] = useState<string | null>(null)
  const [data, setData] = useState<PocketData>({
    name: '',
    emoji: '📁',
    color: 'bg-emerald-500',
    monthlyLimit: 50000,
    isPersonal: false,
  })

  // Obtener el grupo activo del usuario
  useEffect(() => {
    async function fetchGroup() {
      try {
        // Obtener usuario (que incluye activeGroupId) y grupos
        const [userRes, groupsRes] = await Promise.all([
          fetch('/api/user'),
          fetch('/api/groups'),
        ])
        
        if (groupsRes.ok) {
          const { groups } = await groupsRes.json()
          if (groups && groups.length > 0) {
            let selectedGroup = groups[0]
            
            // Si tenemos el usuario con activeGroupId, usarlo
            if (userRes.ok) {
              const userData = await userRes.json()
              if (userData.user?.activeGroupId) {
                const found = groups.find((g: { id: string }) => g.id === userData.user.activeGroupId)
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
          }
        }
      } catch (error) {
        console.error('Error fetching groups:', error)
      }
    }
    fetchGroup()
  }, [])

  const updateData = (newData: Partial<PocketData>) => {
    setData(prev => ({ ...prev, ...newData }))
  }

  const handleSubmit = async () => {
    if (!groupId || !data.name.trim()) return
    
    setLoading(true)
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupId,
          name: data.name,
          icon: data.emoji,
          color: data.color,
          monthlyLimit: data.monthlyLimit,
          isPersonal: data.isPersonal,
        }),
      })

      if (!res.ok) throw new Error('Error al crear bolsillo')
      
      // Si viene de configuraciones, volver a configuraciones; si no, al dashboard
      const returnTo = searchParams.get('returnTo')
      if (returnTo === 'settings') {
        router.push('/dashboard/settings')
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Hubo un error al crear el bolsillo. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const isValid = data.name.trim().length > 0 && groupId

  const formatCurrency = (value: number) => {
    return value.toLocaleString('es-CL')
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Background effects */}
      <div className="fixed inset-0 gradient-mesh opacity-20 pointer-events-none" />
      
      {/* Header */}
      <header className="relative z-10 p-6 border-b border-slate-800">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Volver</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">Bolsillos</span>
          </div>
        </div>
      </header>
      
      {/* Content */}
      <main className="relative z-10 max-w-2xl mx-auto px-6 py-12">
        {/* Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-500 text-white mb-6 shadow-lg shadow-emerald-500/30">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-semibold">Nuevo bolsillo</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Crea un nuevo bolsillo
          </h1>
          <p className="text-lg text-slate-400">
            Organiza tus gastos en categorías con límites mensuales.
          </p>
        </div>

        {/* Preview card */}
        <div className="mb-8">
          <div className="bg-slate-800 rounded-2xl p-6 border-2 border-slate-600">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-16 h-16 rounded-2xl ${data.color} flex items-center justify-center text-3xl shadow-lg`}>
                {data.emoji}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white">
                  {data.name || 'Nombre del bolsillo'}
                </h3>
                <p className="text-slate-400 text-sm flex items-center gap-1">
                  {data.isPersonal ? (
                    <>
                      <Lock className="w-3 h-3" />
                      Personal
                    </>
                  ) : (
                    <>
                      <Users className="w-3 h-3" />
                      Compartido
                    </>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">${formatCurrency(data.monthlyLimit)}</p>
                <p className="text-slate-500 text-sm">límite mensual</p>
              </div>
            </div>
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
              <div className={`h-full ${data.color} rounded-full w-0`} />
            </div>
          </div>
          <p className="text-center text-slate-500 text-sm mt-2">Vista previa del bolsillo</p>
        </div>

        {/* Form */}
        <div className="space-y-8">
          {/* Name */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-300">
              Nombre del bolsillo
            </label>
            <input
              type="text"
              value={data.name}
              onChange={(e) => updateData({ name: e.target.value })}
              placeholder="Ej: Alimentación, Transporte, Ahorro..."
              className="w-full bg-slate-800 border-2 border-slate-600 rounded-2xl py-4 px-6 text-white text-lg placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
            />
          </div>

          {/* Emoji selector */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-300">
              Ícono
            </label>
            
            {/* Input para cualquier emoji */}
            <div className="flex items-center gap-4">
              <div className={`w-20 h-20 rounded-2xl ${data.color} flex items-center justify-center text-4xl shadow-lg`}>
                {data.emoji}
              </div>
              <div className="flex-1">
                <input
                  type="text"
                  value={data.emoji}
                  onChange={(e) => {
                    const newValue = e.target.value
                    // Si el nuevo valor es más largo, tomar el último emoji (reemplazo)
                    if (newValue.length > data.emoji.length) {
                      // Usuario agregó algo - tomar solo lo nuevo
                      const newEmoji = newValue.slice(data.emoji.length).slice(0, 2)
                      if (newEmoji) updateData({ emoji: newEmoji })
                    } else if (newValue.length === 0) {
                      // Borró todo - volver al default
                      updateData({ emoji: '📁' })
                    } else {
                      // Está borrando parcialmente - permitir
                      updateData({ emoji: newValue.slice(0, 2) })
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                  className="w-full bg-slate-800 border-2 border-slate-600 rounded-xl py-3 px-4 text-2xl text-center placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
                />
                <p className="text-slate-500 text-xs mt-2">
                  💡 Haz click y presiona <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-300">Cmd</kbd> + <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-300">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-300">Space</kbd> para cambiar
                </p>
              </div>
            </div>

            {/* Sugeridos */}
            <div className="pt-2">
              <p className="text-xs text-slate-500 mb-2">Sugeridos:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => updateData({ emoji })}
                    className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                      data.emoji === emoji
                        ? 'bg-emerald-500/20 ring-2 ring-emerald-400'
                        : 'bg-slate-800 border border-slate-600 hover:border-slate-500 hover:bg-slate-700'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Color selector */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-300">
              Color
            </label>
            <div className="flex flex-wrap gap-3">
              {availableColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => updateData({ color: color.value })}
                  className={`w-12 h-12 rounded-xl ${color.value} transition-all ${
                    data.color === color.value
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-950 shadow-lg scale-110'
                      : 'hover:scale-105'
                  }`}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Monthly limit */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-300">
              Límite mensual
            </label>
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-medium text-lg">$</span>
              <input
                type="number"
                value={data.monthlyLimit || ''}
                onChange={(e) => updateData({ monthlyLimit: parseInt(e.target.value) || 0 })}
                placeholder="50000"
                className="w-full bg-slate-800 border-2 border-slate-600 rounded-2xl py-4 pl-12 pr-6 text-white text-lg placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
              />
            </div>
            <p className="text-slate-500 text-sm">
              Máximo que quieres gastar en este bolsillo al mes
            </p>
          </div>

          {/* Personal or shared */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-300">
              Tipo de bolsillo
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => updateData({ isPersonal: false })}
                className={`p-5 rounded-2xl text-left transition-all ${
                  !data.isPersonal
                    ? 'bg-emerald-500/20 ring-2 ring-emerald-400 shadow-lg'
                    : 'bg-slate-800 border-2 border-slate-600 hover:border-slate-500'
                }`}
              >
                <Users className={`w-6 h-6 mb-2 ${!data.isPersonal ? 'text-emerald-400' : 'text-slate-400'}`} />
                <h4 className="text-white font-semibold mb-1">Compartido</h4>
                <p className="text-sm text-slate-500">Visible y editable por todos los miembros</p>
              </button>
              <button
                onClick={() => updateData({ isPersonal: true })}
                className={`p-5 rounded-2xl text-left transition-all ${
                  data.isPersonal
                    ? 'bg-emerald-500/20 ring-2 ring-emerald-400 shadow-lg'
                    : 'bg-slate-800 border-2 border-slate-600 hover:border-slate-500'
                }`}
              >
                <Lock className={`w-6 h-6 mb-2 ${data.isPersonal ? 'text-emerald-400' : 'text-slate-400'}`} />
                <h4 className="text-white font-semibold mb-1">Personal</h4>
                <p className="text-sm text-slate-500">Solo tú puedes editarlo (otros pueden verlo)</p>
              </button>
            </div>
          </div>

          {/* Submit button */}
          <div className="pt-4">
            <button
              onClick={handleSubmit}
              disabled={!isValid || loading}
              className="w-full gradient-primary text-white font-semibold py-4 px-6 rounded-2xl hover:shadow-xl hover:shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group text-lg"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  Crear bolsillo
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>

          {/* Cancel link */}
          <div className="text-center">
            <Link 
              href="/dashboard" 
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              Cancelar
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
