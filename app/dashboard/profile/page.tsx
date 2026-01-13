'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createBrowserClient } from '@supabase/ssr'
import { User, Save, Loader2 } from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [initialName, setInitialName] = useState('')

  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          const userName = user.user_metadata?.name || ''
          setName(userName)
          setInitialName(userName)
          setEmail(user.email || '')
        }
      } catch (error) {
        console.error('Error fetching user info:', error)
        toast.error('Error al cargar información del usuario')
      } finally {
        setLoading(false)
      }
    }
    fetchUserInfo()
  }, [])

  const handleSave = async () => {
    if (name.trim() === initialName.trim()) {
      toast.info('No hay cambios para guardar')
      return
    }

    setSaving(true)
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      // Actualizar metadata del usuario en Supabase
      const { error: updateError } = await supabase.auth.updateUser({
        data: { name: name.trim() || null }
      })

      if (updateError) throw updateError

      // Actualizar en nuestra base de datos
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() || null }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al actualizar perfil')
      }

      setInitialName(name.trim())
      toast.success('Perfil actualizado', {
        description: 'Los cambios se guardaron correctamente',
      })
      
      // Notificar al layout para que actualice el nombre
      window.dispatchEvent(new CustomEvent('userUpdated'))
    } catch (error: unknown) {
      console.error('Error saving profile:', error)
      const message = error instanceof Error ? error.message : 'Ocurrió un error inesperado'
      toast.error('Error al guardar', {
        description: message,
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Mi Perfil</h1>
        <p className="text-slate-400 text-sm mt-1">Administra tu información personal</p>
      </div>

      {/* Profile form */}
      <section className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <User className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Información Personal</h2>
              <p className="text-sm text-slate-400">Actualiza tu nombre y datos básicos</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nombre
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              className="w-full bg-slate-900 border border-slate-600 rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            <p className="text-xs text-slate-500 mt-1">
              Este nombre se mostrará en tus espacios y gastos
            </p>
          </div>

          {/* Email (solo lectura) */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full bg-slate-900 border border-slate-600 rounded-xl py-3 px-4 text-slate-400 opacity-60 cursor-not-allowed"
            />
            <p className="text-xs text-slate-500 mt-1">
              El email no se puede modificar. Está vinculado a tu cuenta de autenticación.
            </p>
          </div>

          {/* Botón guardar */}
          <button
            onClick={handleSave}
            disabled={saving || name.trim() === initialName.trim()}
            className="flex items-center gap-2 gradient-primary text-white font-medium py-3 px-6 rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            Guardar cambios
          </button>
        </div>
      </section>
    </div>
  )
}
