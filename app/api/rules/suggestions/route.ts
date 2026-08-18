import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, canUserAccessGroup } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { merchantKey } from '@/lib/merchantKey'

const MIN_APARICIONES = 2 // mismo umbral que la memoria de bank-sync
const MESES_ATRAS = 6

/**
 * Agrupa el historial importado por comercio y separa dos casos muy distintos:
 *  - "aprendidos": comercios que siempre categorizaste igual. bank-sync YA los
 *    resuelve solo; se listan para que veas qué aprendió, no para que confirmes.
 *  - "ambiguos": comercios con más de una categoría (ej. pasarelas como MercadoPago,
 *    donde el comercio real queda oculto). Acá una regla SÍ agrega valor, porque es
 *    una decisión tuya que el sistema no puede deducir.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext(request)
    if (!auth) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId') || (auth.type === 'token' ? auth.groupId : null)
    if (!groupId) return NextResponse.json({ error: 'groupId es requerido' }, { status: 400 })
    if (auth.type === 'token' && groupId !== auth.groupId) {
      return NextResponse.json({ error: 'Este token no tiene acceso a ese grupo' }, { status: 403 })
    }
    if (!(await canUserAccessGroup(auth.userId, groupId))) {
      return NextResponse.json({ error: 'No tienes acceso a este grupo' }, { status: 403 })
    }

    const desde = new Date()
    desde.setMonth(desde.getMonth() - MESES_ATRAS)

    const [expenses, rules] = await Promise.all([
      prisma.expense.findMany({
        where: { groupId, bank: { not: null }, isRecurring: false, date: { gte: desde } },
        select: { description: true, categoryId: true, category: { select: { id: true, name: true, icon: true, color: true } } },
      }),
      prisma.categoryRule.findMany({ where: { groupId }, select: { keyword: true } }),
    ])

    const yaTieneRegla = new Set(rules.map((r) => merchantKey(r.keyword)))

    type Grupo = { comercio: string; ejemplo: string; total: number; porCategoria: Map<string, { cat: NonNullable<typeof expenses[number]['category']>; n: number }> }
    const grupos = new Map<string, Grupo>()

    for (const e of expenses) {
      // "Sin categorizar" no vota: significa "no supe", no una decisión tuya.
      if (!e.category || e.category.name.trim().toLowerCase() === 'sin categorizar') continue
      const descripcion = e.description ?? ''
      const k = merchantKey(descripcion)
      if (!k) continue
      if (!grupos.has(k)) grupos.set(k, { comercio: k, ejemplo: descripcion, total: 0, porCategoria: new Map() })
      const g = grupos.get(k)!
      g.total++
      if (descripcion.length > g.ejemplo.length) g.ejemplo = descripcion
      const prev = g.porCategoria.get(e.category.id)
      g.porCategoria.set(e.category.id, { cat: e.category, n: (prev?.n ?? 0) + 1 })
    }

    const aprendidos: unknown[] = []
    const ambiguos: unknown[] = []

    for (const g of grupos.values()) {
      const cats = [...g.porCategoria.values()].sort((a, b) => b.n - a.n)
      const base = { comercio: g.comercio, ejemplo: g.ejemplo, veces: g.total, tieneRegla: yaTieneRegla.has(g.comercio) }
      if (cats.length === 1) {
        if (g.total >= MIN_APARICIONES) aprendidos.push({ ...base, categoria: cats[0].cat })
      } else {
        ambiguos.push({ ...base, categorias: cats.map((c) => ({ categoria: c.cat, veces: c.n })) })
      }
    }

    aprendidos.sort((a, b) => (b as { veces: number }).veces - (a as { veces: number }).veces)
    ambiguos.sort((a, b) => (b as { veces: number }).veces - (a as { veces: number }).veces)

    return NextResponse.json({ aprendidos, ambiguos })
  } catch (error) {
    console.error('Error building suggestions:', error)
    return NextResponse.json({ error: 'Error al calcular sugerencias' }, { status: 500 })
  }
}
