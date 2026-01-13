import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, canUserAccessGroup } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Obtener categorías de un grupo
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')

    if (!groupId) {
      return NextResponse.json(
        { error: 'groupId es requerido' },
        { status: 400 }
      )
    }

    const hasAccess = await canUserAccessGroup(user.id, groupId)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'No tienes acceso a este grupo' },
        { status: 403 }
      )
    }

    // Obtener todas las categorías del grupo
    // Para personales, solo mostrar las del usuario o todas (transparencia)
    const categories = await prisma.category.findMany({
      where: {
        groupId,
        // Mostrar todas: compartidas y personales (transparencia dentro del grupo)
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Error al obtener categorías' },
      { status: 500 }
    )
  }
}

// POST - Crear nueva categoría
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { groupId, name, icon, color, isPersonal = false, monthlyLimit } = body

    if (!groupId || !name) {
      return NextResponse.json(
        { error: 'groupId y name son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el grupo activo del usuario coincida con el grupo proporcionado
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { activeGroupId: true },
    })

    if (!dbUser?.activeGroupId) {
      return NextResponse.json(
        { error: 'No tienes un grupo activo. Por favor, selecciona un grupo primero.' },
        { status: 400 }
      )
    }

    if (dbUser.activeGroupId !== groupId) {
      return NextResponse.json(
        { error: 'El grupo proporcionado no coincide con tu grupo activo. Por favor, cambia al grupo correcto.' },
        { status: 400 }
      )
    }

    const hasAccess = await canUserAccessGroup(user.id, groupId)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'No tienes acceso a este grupo' },
        { status: 403 }
      )
    }

    const category = await prisma.category.create({
      data: {
        groupId,
        name,
        icon: icon || null,
        color: color || null,
        isPersonal,
        ownerId: isPersonal ? user.id : null,
        monthlyLimit: monthlyLimit || null,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Error al crear categoría' },
      { status: 500 }
    )
  }
}
