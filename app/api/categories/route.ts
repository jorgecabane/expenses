import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, getCurrentUser, canUserAccessGroup } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Obtener categorías de un grupo
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext(request)
    if (!auth) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    // Un token queda atado a un solo espacio: si no viene groupId, se usa el del token;
    // si viene uno distinto, se rechaza (nunca puede consultar otro espacio).
    const groupId = searchParams.get('groupId') || (auth.type === 'token' ? auth.groupId : null)

    if (!groupId) {
      return NextResponse.json(
        { error: 'groupId es requerido' },
        { status: 400 }
      )
    }

    if (auth.type === 'token' && groupId !== auth.groupId) {
      return NextResponse.json(
        { error: 'Este token no tiene acceso a ese grupo' },
        { status: 403 }
      )
    }

    const hasAccess = await canUserAccessGroup(auth.userId, groupId)
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
    // Acepta sesión (la app) o token de API (bank-sync), igual que GET.
    const auth = await getAuthContext(request)
    if (!auth) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { name, icon, color, isPersonal = false, monthlyLimit } = body
    // Un token está atado a su espacio; la sesión usa el que venga en el body.
    const groupId = body.groupId || (auth.type === 'token' ? auth.groupId : null)

    if (!groupId || !name) {
      return NextResponse.json(
        { error: 'groupId y name son requeridos' },
        { status: 400 }
      )
    }

    if (auth.type === 'token' && groupId !== auth.groupId) {
      return NextResponse.json({ error: 'Este token no tiene acceso a ese grupo' }, { status: 403 })
    }

    // Verificar que el grupo activo del usuario coincida con el grupo proporcionado
    // (guarda de la UI: el token no tiene "grupo activo", ya quedó atado arriba)
    if (auth.type === 'session') {
      const dbUser = await prisma.user.findUnique({
        where: { id: auth.userId },
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
    }

    const hasAccess = await canUserAccessGroup(auth.userId, groupId)
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
        ownerId: isPersonal ? auth.userId : null,
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
