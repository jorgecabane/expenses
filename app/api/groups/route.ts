import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, canUserAccessGroup } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Obtener grupos del usuario
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const memberships = await prisma.groupMember.findMany({
      where: {
        userId: user.id,
      },
      include: {
        group: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    avatarUrl: true,
                  },
                },
              },
            },
            _count: {
              select: {
                categories: true,
                expenses: true,
              },
            },
          },
        },
      },
      orderBy: {
        joinedAt: 'desc',
      },
    })

    // Incluir el rol del usuario actual en cada grupo
    const groups = memberships.map((m: { group: any; role: string }) => ({
      ...m.group,
      currentUserRole: m.role,
    }))

    return NextResponse.json({ groups, currentUserId: user.id })
  } catch (error) {
    console.error('Error fetching groups:', error)
    return NextResponse.json(
      { error: 'Error al obtener grupos' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo grupo
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { name, currency = 'USD' } = body

    if (!name) {
      return NextResponse.json(
        { error: 'El nombre del grupo es requerido' },
        { status: 400 }
      )
    }

    // Crear grupo y agregar al usuario como owner
    const group = await prisma.familyGroup.create({
      data: {
        name,
        currency,
        createdBy: user.id,
        members: {
          create: {
            userId: user.id,
            role: 'owner',
          },
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ group }, { status: 201 })
  } catch (error) {
    console.error('Error creating group:', error)
    return NextResponse.json(
      { error: 'Error al crear grupo' },
      { status: 500 }
    )
  }
}
