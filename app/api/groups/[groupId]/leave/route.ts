import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, canUserAccessGroup, getUserRoleInGroup } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST - Abandonar un grupo
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { groupId } = await params

    // Verificar que el usuario es miembro del grupo
    const hasAccess = await canUserAccessGroup(user.id, groupId)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'No eres miembro de este grupo' },
        { status: 403 }
      )
    }

    // Verificar que no es el owner (el owner no puede abandonar, debe eliminar)
    const role = await getUserRoleInGroup(user.id, groupId)
    if (role === 'owner') {
      return NextResponse.json(
        { error: 'El dueño no puede abandonar el grupo. Transfiere la propiedad o elimínalo.' },
        { status: 400 }
      )
    }

    // Eliminar la membresía del usuario
    await prisma.groupMember.delete({
      where: {
        groupId_userId: {
          groupId,
          userId: user.id,
        },
      },
    })

    // Opcional: Eliminar categorías personales del usuario en este grupo
    await prisma.category.deleteMany({
      where: {
        groupId,
        isPersonal: true,
        ownerId: user.id,
      },
    })

    return NextResponse.json({ success: true, message: 'Has abandonado el grupo' })
  } catch (error) {
    console.error('Error leaving group:', error)
    return NextResponse.json(
      { error: 'Error al abandonar el grupo' },
      { status: 500 }
    )
  }
}
