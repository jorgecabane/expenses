import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, canUserAccessGroup, canUserEditGroup } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Obtener un grupo específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { groupId } = await params

    const hasAccess = await canUserAccessGroup(user.id, groupId)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'No tienes acceso a este grupo' },
        { status: 403 }
      )
    }

    const group = await prisma.familyGroup.findUnique({
      where: { id: groupId },
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
        categories: {
          orderBy: {
            name: 'asc',
          },
        },
      },
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Grupo no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ group })
  } catch (error) {
    console.error('Error fetching group:', error)
    return NextResponse.json(
      { error: 'Error al obtener grupo' },
      { status: 500 }
    )
  }
}

// PATCH - Actualizar grupo
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { groupId } = await params

    const canEdit = await canUserEditGroup(user.id, groupId)
    if (!canEdit) {
      return NextResponse.json(
        { error: 'No tienes permisos para editar este grupo' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, currency } = body

    const updateData: {
      name?: string
      currency?: string
    } = {}
    if (name !== undefined) updateData.name = name
    if (currency !== undefined) updateData.currency = currency

    const group = await prisma.familyGroup.update({
      where: { id: groupId },
      data: updateData,
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

    return NextResponse.json({ group })
  } catch (error) {
    console.error('Error updating group:', error)
    return NextResponse.json(
      { error: 'Error al actualizar grupo' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar grupo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { groupId } = await params

    const canEdit = await canUserEditGroup(user.id, groupId)
    if (!canEdit) {
      return NextResponse.json(
        { error: 'Solo el owner puede eliminar el grupo' },
        { status: 403 }
      )
    }

    await prisma.familyGroup.delete({
      where: { id: groupId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting group:', error)
    return NextResponse.json(
      { error: 'Error al eliminar grupo' },
      { status: 500 }
    )
  }
}
