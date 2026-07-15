import { randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, hashApiToken, canUserAccessGroup } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Listar los API tokens del usuario (nunca se devuelve el token en sí, ya revocado o no)
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const tokens = await prisma.apiToken.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        groupId: true,
        group: { select: { name: true } },
        lastUsedAt: true,
        revokedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ tokens })
  } catch (error) {
    console.error('Error fetching API tokens:', error)
    return NextResponse.json({ error: 'Error al obtener tokens' }, { status: 500 })
  }
}

// POST - Crear un nuevo API token (el token en texto plano solo se devuelve acá, una sola vez)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { name, groupId } = body

    if (!name || !groupId) {
      return NextResponse.json({ error: 'name y groupId son requeridos' }, { status: 400 })
    }

    const hasAccess = await canUserAccessGroup(user.id, groupId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'No tienes acceso a este grupo' }, { status: 403 })
    }

    const rawToken = `bsk_${randomBytes(32).toString('hex')}`
    const tokenHash = hashApiToken(rawToken)

    const apiToken = await prisma.apiToken.create({
      data: { userId: user.id, groupId, name, tokenHash },
      select: { id: true, name: true, groupId: true, createdAt: true },
    })

    // El token en texto plano se devuelve una única vez - el cliente debe guardarlo ahora
    return NextResponse.json({ token: rawToken, apiToken }, { status: 201 })
  } catch (error) {
    console.error('Error creating API token:', error)
    return NextResponse.json({ error: 'Error al crear token' }, { status: 500 })
  }
}
