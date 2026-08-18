'use client'

import { useState, useEffect, useCallback } from 'react'
import NextLink from 'next/link'
import { toast } from 'sonner'
import { Brain, CircleHelp, Loader2, Pin, Trash2, ChevronLeft, Sparkles } from 'lucide-react'

interface Categoria { id: string; name: string; icon: string | null; color?: string | null }
interface Aprendido { comercio: string; ejemplo: string; veces: number; tieneRegla: boolean; categoria: Categoria }
interface Ambiguo { comercio: string; ejemplo: string; veces: number; tieneRegla: boolean; categorias: Array<{ categoria: Categoria; veces: number }> }
interface Regla { id: string; keyword: string; category: Categoria }

export default function AprendizajeContent({ groupId, categories }: { groupId: string; categories: Categoria[] }) {
  const [aprendidos, setAprendidos] = useState<Aprendido[]>([])
  const [ambiguos, setAmbiguos] = useState<Ambiguo[]>([])
  const [reglas, setReglas] = useState<Regla[]>([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    try {
      const [s, r] = await Promise.all([
        fetch(`/api/rules/suggestions?groupId=${groupId}`).then((x) => x.json()),
        fetch(`/api/rules?groupId=${groupId}`).then((x) => x.json()),
      ])
      setAprendidos(s.aprendidos ?? [])
      setAmbiguos(s.ambiguos ?? [])
      setReglas(r.rules ?? [])
    } catch {
      toast.error('No pude cargar el aprendizaje')
    } finally {
      setCargando(false)
    }
  }, [groupId])

  useEffect(() => { cargar() }, [cargar])

  async function fijar(keyword: string, categoryId: string) {
    setGuardando(keyword)
    try {
      const res = await fetch('/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, keyword, categoryId }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Regla fijada para ${keyword}`)
      await cargar()
    } catch {
      toast.error('No pude crear la regla')
    } finally {
      setGuardando(null)
    }
  }

  async function borrar(id: string) {
    setGuardando(id)
    try {
      const res = await fetch(`/api/rules/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      toast.success('Regla eliminada')
      await cargar()
    } catch {
      toast.error('No pude eliminar la regla')
    } finally {
      setGuardando(null)
    }
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando aprendizaje…
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <NextLink href="/dashboard/settings" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors">
        <ChevronLeft className="w-4 h-4" /> Ajustes
      </NextLink>

      <header className="flex items-start gap-3">
        <div className="p-2 bg-violet-500/20 rounded-lg shrink-0">
          <Brain className="w-5 h-5 text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Aprendizaje</h1>
          <p className="text-sm text-slate-400 mt-1">
            Los gastos que importa el banco se categorizan solos cuando ya viste ese comercio antes.
            Acá podés ver qué aprendió y corregirlo.
          </p>
        </div>
      </header>

      {/* Ambiguos: acá una regla SÍ aporta */}
      {ambiguos.length > 0 && (
        <section className="bg-amber-500/5 rounded-2xl border border-amber-500/20 overflow-hidden">
          <div className="p-5 border-b border-amber-500/20 flex items-start gap-3">
            <CircleHelp className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-semibold text-amber-300">Necesitan tu criterio</h2>
              <p className="text-sm text-slate-400 mt-0.5">
                Estos comercios los categorizaste de formas distintas, así que el sistema no puede decidir solo.
                Suele pasar con pasarelas de pago, donde el comercio real queda oculto. Fijá uno si querés que siempre vaya al mismo bolsillo.
              </p>
            </div>
          </div>
          <div className="divide-y divide-slate-700">
            {ambiguos.map((a) => (
              <div key={a.comercio} className="p-5">
                <p className="text-white font-medium truncate">{a.ejemplo}</p>
                <p className="text-xs text-slate-500 mt-0.5">{a.veces} movimientos</p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {a.categorias.map((c) => (
                    <span key={c.categoria.id} className="text-[11px] px-2 py-0.5 rounded-md bg-slate-700/60 text-slate-300">
                      {c.categoria.icon} {c.categoria.name} · {c.veces}
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <label htmlFor={`fijar-${a.comercio}`} className="text-xs text-slate-400">
                    Fijar siempre a:
                  </label>
                  <select
                    id={`fijar-${a.comercio}`}
                    defaultValue=""
                    disabled={guardando === a.comercio}
                    onChange={(e) => e.target.value && fijar(a.comercio, e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                  >
                    <option value="">Elegir bolsillo…</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {guardando === a.comercio && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Reglas fijadas */}
      {reglas.length > 0 && (
        <section className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
          <div className="p-5 border-b border-slate-700 flex items-center gap-3">
            <Pin className="w-5 h-5 text-violet-400" />
            <div>
              <h2 className="font-semibold text-white">Reglas fijadas por vos</h2>
              <p className="text-sm text-slate-400 mt-0.5">Mandan por sobre lo aprendido automáticamente.</p>
            </div>
          </div>
          <div className="divide-y divide-slate-700">
            {reglas.map((r) => (
              <div key={r.id} className="p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{r.keyword}</p>
                  <p className="text-xs text-slate-500">→ {r.category.icon} {r.category.name}</p>
                </div>
                <button
                  onClick={() => borrar(r.id)}
                  disabled={guardando === r.id}
                  aria-label={`Eliminar la regla ${r.keyword}`}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {guardando === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Lo aprendido solo */}
      <section className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden">
        <div className="p-5 border-b border-slate-700 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <div>
            <h2 className="font-semibold text-white">Se categorizan solos</h2>
            <p className="text-sm text-slate-400 mt-0.5">
              {aprendidos.length} comercios que siempre mandaste al mismo bolsillo. No hay nada que confirmar.
            </p>
          </div>
        </div>
        {aprendidos.length === 0 ? (
          <p className="p-8 text-center text-slate-400 text-sm">
            Todavía no hay suficiente historial. Con dos movimientos del mismo comercio empieza a aprender.
          </p>
        ) : (
          <div className="divide-y divide-slate-700">
            {aprendidos.map((a) => (
              <div key={a.comercio} className="p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{a.ejemplo}</p>
                  <p className="text-xs text-slate-500">
                    → {a.categoria.icon} {a.categoria.name} · {a.veces} movimientos
                  </p>
                </div>
                {a.tieneRegla && (
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-violet-500/20 text-violet-300 shrink-0">fijado</span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
