'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Users } from 'lucide-react'

interface Props {
  groupName: string
  token: string
}

export default function AcceptInvitationForm({ groupName, token }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLoginClick = () => {
    setLoading(true)
    router.push(`/login?redirect=${encodeURIComponent(`/invite/${token}`)}`)
  }

  const handleRegisterClick = () => {
    setLoading(true)
    router.push(`/register?redirect=${encodeURIComponent(`/invite/${token}`)}`)
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
        {/* Header con gradiente */}
        <div className="relative p-8 text-center bg-gradient-to-br from-emerald-500/20 via-slate-900 to-slate-900">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.1),transparent_70%)]" />
          
          <div className="relative">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Users className="w-8 h-8" />
            </div>
            
            <p className="text-emerald-400 text-sm font-medium mb-2">
              Espacio compartido
            </p>
            
            <h1 className="text-2xl font-bold text-white">
              {groupName}
            </h1>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <div className="text-center">
            <p className="text-slate-300 text-lg">
              Te han invitado a unirte a este espacio
            </p>
            <p className="text-slate-500 text-sm mt-2">
              Para aceptar la invitación, inicia sesión o crea una cuenta
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleRegisterClick}
              disabled={loading}
              className="w-full py-4 px-6 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-all hover:shadow-lg hover:shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Crear cuenta y unirme'
              )}
            </button>
            
            <button
              onClick={handleLoginClick}
              disabled={loading}
              className="w-full py-4 px-6 rounded-xl border border-slate-600 text-white font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Ya tengo cuenta
            </button>
          </div>

          <p className="text-center text-slate-500 text-xs">
            Al unirte podrás ver y registrar gastos compartidos con los demás miembros del espacio
          </p>
        </div>
      </div>
    </div>
  )
}
