import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Obtener información del usuario
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        activeGroupId: true,
      },
    })

    if (!dbUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user: dbUser })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Error al obtener usuario' },
      { status: 500 }
    )
  }
}

// PATCH - Actualizar información del usuario
export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { name, activeGroupId } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name || null
    if (activeGroupId !== undefined) {
      // Verificar que el usuario tenga acceso al grupo antes de guardarlo
      if (activeGroupId) {
        const membership = await prisma.groupMember.findFirst({
          where: {
            userId: user.id,
            groupId: activeGroupId,
          },
        })
        if (!membership) {
          return NextResponse.json(
            { error: 'No tienes acceso a este grupo' },
            { status: 403 }
          )
        }
      }
      updateData.activeGroupId = activeGroupId || null
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        activeGroupId: true,
      },
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Error al actualizar usuario' },
      { status: 500 }
    )
  }
}
