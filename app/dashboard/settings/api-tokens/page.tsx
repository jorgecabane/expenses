'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, KeyRound, Loader2, Copy, Trash2, Check } from 'lucide-react'

interface Group {
  id: string
  name: string
}

interface ApiToken {
  id: string
  name: string
  groupId: string
  group: { name: string }
  lastUsedAt: string | null
  revokedAt: string | null
  createdAt: string
}

export default function ApiTokensPage() {
  const [tokens, setTokens] = useState<ApiToken[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [newTokenName, setNewTokenName] = useState('')
  const [newTokenGroupId, setNewTokenGroupId] = useState('')
  const [justCreatedToken, setJustCreatedToken] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [tokensRes, groupsRes] = await Promise.all([
          fetch('/api/api-tokens'),
          fetch('/api/groups'),
        ])

        if (tokensRes.ok) {
          const data = await tokensRes.json()
          setTokens(data.tokens || [])
        }

        if (groupsRes.ok) {
          const data = await groupsRes.json()
          setGroups(data.groups || [])
          if (data.groups?.length > 0) {
            setNewTokenGroupId(data.groups[0].id)
          }
        }
      } catch (error) {
        console.error('Error fetching API tokens:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleCreateToken = async () => {
    if (!newTokenName.trim() || !newTokenGroupId) return

    setCreating(true)
    setJustCreatedToken(null)

    try {
      const res = await fetch('/api/api-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTokenName, groupId: newTokenGroupId }),
      })

      const data = await res.json()

      if (res.ok) {
        const group = groups.find((g) => g.id === newTokenGroupId)
        setTokens([{ ...data.apiToken, group: { name: group?.name || '' }, lastUsedAt: null, revokedAt: null }, ...tokens])
        setJustCreatedToken(data.token)
        setNewTokenName('')
        toast.success('Token creado')
      } else {
        toast.error('Error al crear token', { description: data.error })
      }
    } catch (error) {
      console.error('Error creating token:', error)
      toast.error('Error al crear token')
    } finally {
      setCreating(false)
    }
  }

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token)
    toast.success('Token copiado al portapapeles')
  }

  const handleRevoke = (token: ApiToken) => {
    toast.custom((t) => (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 shadow-xl max-w-sm">
        <p className="text-white font-medium mb-2">¿Revocar token?</p>
        <p className="text-slate-400 text-sm mb-4">
          &ldquo;{token.name}&rdquo; dejará de funcionar de inmediato. Esta acción no se puede deshacer.
        </p>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              toast.dismiss(t)
              setRevokingId(token.id)
              try {
                const res = await fetch(`/api/api-tokens/${token.id}`, { method: 'DELETE' })
                if (res.ok) {
                  setTokens(tokens.map((tk) => (tk.id === token.id ? { ...tk, revokedAt: new Date().toISOString() } : tk)))
                  toast.success('Token revocado')
                } else {
                  toast.error('Error al revocar token')
                }
              } catch {
                toast.error('Error al revocar token')
              } finally {
                setRevokingId(null)
              }
            }}
            className="flex-1 bg-red-500 text-white text-sm font-medium py-2 px-3 rounded-lg hover:bg-red-600 transition-colors"
          >
            Revocar
          </button>
          <button
            onClick={() => toast.dismiss(t)}
            className="flex-1 bg-slate-700 text-white text-sm font-medium py-2 px-3 rounded-lg hover:bg-slate-600 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    ), { duration: 10000 })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Configuración
        </Link>
        <h1 className="text-2xl font-bold text-white">API Tokens</h1>
        <p className="text-slate-400 text-sm mt-1">
          Acceso programático a un espacio, para integraciones como scripts de sincronización.
        </p>
      </div>

      {/* Crear token */}
      <section className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <KeyRound className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Nuevo token</h2>
              <p className="text-sm text-slate-400">Queda atado a un solo espacio, nunca puede acceder a otros</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newTokenName}
              onChange={(e) => setNewTokenName(e.target.value)}
              placeholder="ej. Bank sync script"
              className="flex-1 bg-slate-900 border border-slate-600 rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            <select
              value={newTokenGroupId}
              onChange={(e) => setNewTokenGroupId(e.target.value)}
              className="bg-slate-900 border border-slate-600 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
            <button
              onClick={handleCreateToken}
              disabled={creating || !newTokenName.trim() || !newTokenGroupId}
              className="flex items-center justify-center gap-2 gradient-primary text-white font-medium py-3 px-6 rounded-xl hover:shadow-lg hover:shadow-emerald-500/30 transition-all disabled:opacity-50"
            >
              {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Generar'}
            </button>
          </div>

          {justCreatedToken && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium mb-2">
                <Check className="w-4 h-4" />
                Guardalo ahora — no se va a volver a mostrar
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={justCreatedToken}
                  readOnly
                  className="flex-1 bg-slate-800 border border-slate-600 rounded-lg py-2 px-3 text-sm text-slate-300 font-mono truncate"
                />
                <button
                  onClick={() => copyToken(justCreatedToken)}
                  className="flex items-center gap-1 bg-slate-700 text-white text-sm font-medium py-2 px-3 rounded-lg hover:bg-slate-600 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Copiar
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Lista de tokens */}
      <section className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Tokens existentes</h2>
          <p className="text-sm text-slate-400">{tokens.length} token(s)</p>
        </div>

        <div className="divide-y divide-slate-700/50">
          {tokens.map((token) => (
            <div key={token.id} className="p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{token.name}</p>
                <p className="text-sm text-slate-500 truncate">
                  {token.group.name} · Creado el {new Date(token.createdAt).toLocaleDateString('es-CL')}
                  {' · '}
                  {token.lastUsedAt
                    ? `Usado por última vez el ${new Date(token.lastUsedAt).toLocaleDateString('es-CL')}`
                    : 'Nunca usado'}
                </p>
              </div>
              {token.revokedAt ? (
                <span className="text-slate-400 text-xs font-medium bg-slate-700 px-2 py-1 rounded-full">
                  Revocado
                </span>
              ) : (
                <button
                  onClick={() => handleRevoke(token)}
                  disabled={revokingId === token.id}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                  title="Revocar token"
                >
                  {revokingId === token.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          ))}

          {tokens.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-slate-400">No tenés tokens creados</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
