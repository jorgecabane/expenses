import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, canUserEditGroup } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE - Eliminar un miembro del grupo (solo owner)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string; memberId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { groupId, memberId } = await params

    // Verificar que el usuario es owner del grupo
    const canEdit = await canUserEditGroup(user.id, groupId)
    if (!canEdit) {
      return NextResponse.json(
        { error: 'Solo el owner puede eliminar miembros' },
        { status: 403 }
      )
    }

    // Obtener el miembro a eliminar
    const member = await prisma.groupMember.findUnique({
      where: { id: memberId },
      include: {
        user: true,
      },
    })

    if (!member) {
      return NextResponse.json(
        { error: 'Miembro no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el miembro pertenece al grupo
    if (member.groupId !== groupId) {
      return NextResponse.json(
        { error: 'El miembro no pertenece a este grupo' },
        { status: 400 }
      )
    }

    // No permitir eliminar al owner
    if (member.role === 'owner') {
      return NextResponse.json(
        { error: 'No se puede eliminar al dueño del grupo' },
        { status: 400 }
      )
    }

    // Eliminar categorías personales del miembro en este grupo
    await prisma.category.deleteMany({
      where: {
        groupId,
        isPersonal: true,
        ownerId: member.userId,
      },
    })

    // Eliminar la membresía
    await prisma.groupMember.delete({
      where: { id: memberId },
    })

    return NextResponse.json({ 
      success: true, 
      message: `Se eliminó a ${member.user.name || member.user.email} del grupo` 
    })
  } catch (error) {
    console.error('Error removing member:', error)
    return NextResponse.json(
      { error: 'Error al eliminar miembro' },
      { status: 500 }
    )
  }
}
