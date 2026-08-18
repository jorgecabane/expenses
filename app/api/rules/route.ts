import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, canUserAccessGroup } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/** Resuelve el grupo respetando que un token está atado a un solo espacio. */
async function resolveGroup(request: NextRequest, bodyGroupId?: string) {
  const auth = await getAuthContext(request)
  if (!auth) return { error: NextResponse.json({ error: 'No autenticado' }, { status: 401 }) }

  const { searchParams } = new URL(request.url)
  const groupId = bodyGroupId || searchParams.get('groupId') || (auth.type === 'token' ? auth.groupId : null)
  if (!groupId) return { error: NextResponse.json({ error: 'groupId es requerido' }, { status: 400 }) }

  if (auth.type === 'token' && groupId !== auth.groupId) {
    return { error: NextResponse.json({ error: 'Este token no tiene acceso a ese grupo' }, { status: 403 }) }
  }
  if (!(await canUserAccessGroup(auth.userId, groupId))) {
    return { error: NextResponse.json({ error: 'No tienes acceso a este grupo' }, { status: 403 }) }
  }
  return { auth, groupId }
}

// GET - Reglas del grupo (las consume la app y también bank-sync)
export async function GET(request: NextRequest) {
  try {
    const ctx = await resolveGroup(request)
    if ('error' in ctx) return ctx.error

    const rules = await prisma.categoryRule.findMany({
      where: { groupId: ctx.groupId },
      include: { category: { select: { id: true, name: true, icon: true, color: true } } },
      orderBy: { keyword: 'asc' },
    })
    return NextResponse.json({ rules })
  } catch (error) {
    console.error('Error fetching rules:', error)
    return NextResponse.json({ error: 'Error al obtener reglas' }, { status: 500 })
  }
}

// POST - Crear regla
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const ctx = await resolveGroup(request, body.groupId)
    if ('error' in ctx) return ctx.error

    const keyword = String(body.keyword ?? '').trim()
    if (!keyword || !body.categoryId) {
      return NextResponse.json({ error: 'keyword y categoryId son requeridos' }, { status: 400 })
    }

    const category = await prisma.category.findFirst({ where: { id: body.categoryId, groupId: ctx.groupId } })
    if (!category) {
      return NextResponse.json({ error: 'La categoría no pertenece a este espacio' }, { status: 400 })
    }

    // upsert: reintentar con el mismo keyword actualiza en vez de reventar contra el unique
    const rule = await prisma.categoryRule.upsert({
      where: { groupId_keyword: { groupId: ctx.groupId, keyword } },
      create: { groupId: ctx.groupId, keyword, categoryId: body.categoryId, createdBy: ctx.auth.userId },
      update: { categoryId: body.categoryId },
      include: { category: { select: { id: true, name: true, icon: true, color: true } } },
    })
    return NextResponse.json({ rule })
  } catch (error) {
    console.error('Error creating rule:', error)
    return NextResponse.json({ error: 'Error al crear la regla' }, { status: 500 })
  }
}
