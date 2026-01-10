import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, canUserEditGroup } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { resend } from '@/lib/resend'

// Función helper para buscar invitación por token o ID
async function findInvitation(tokenOrId: string) {
  // Los tokens son 64 caracteres hex, los IDs (cuid) son ~25 caracteres
  if (tokenOrId.length === 64) {
    return prisma.groupInvitation.findUnique({ where: { token: tokenOrId } })
  }
  return prisma.groupInvitation.findUnique({ where: { id: tokenOrId } })
}

// GET - Obtener información de la invitación
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    const invitation = await prisma.groupInvitation.findUnique({
      where: { token },
      include: {
        group: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitación no encontrada' },
        { status: 404 }
      )
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: 'Esta invitación ya fue procesada' },
        { status: 400 }
      )
    }

    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Esta invitación ha expirado' },
        { status: 400 }
      )
    }

    return NextResponse.json({ invitation })
  } catch (error) {
    console.error('Error fetching invitation:', error)
    return NextResponse.json(
      { error: 'Error al obtener invitación' },
      { status: 500 }
    )
  }
}

// POST - Aceptar invitación
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Debes iniciar sesión para aceptar la invitación' },
        { status: 401 }
      )
    }

    const { token } = await params

    const invitation = await prisma.groupInvitation.findUnique({
      where: { token },
      include: {
        group: true,
      },
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitación no encontrada' },
        { status: 404 }
      )
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: 'Esta invitación ya fue procesada' },
        { status: 400 }
      )
    }

    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Esta invitación ha expirado' },
        { status: 400 }
      )
    }

    // NOTA: No verificamos que el email coincida.
    // Cualquier usuario autenticado con el link puede "reclamar" la invitación.
    // El link (token de 64 chars) es el secreto de autenticación.

    // Verificar que no esté ya en el grupo
    const existingMember = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: invitation.groupId,
          userId: user.id,
        },
      },
    })

    if (existingMember) {
      // Ya es miembro, marcar invitación como aceptada
      await prisma.groupInvitation.update({
        where: { id: invitation.id },
        data: { status: 'accepted' },
      })

      return NextResponse.json({
        message: 'Ya eres miembro de este grupo',
        group: invitation.group,
      })
    }

    // Agregar como miembro
    await prisma.groupMember.create({
      data: {
        groupId: invitation.groupId,
        userId: user.id,
        role: 'member',
      },
    })

    // Actualizar invitación
    await prisma.groupInvitation.update({
      where: { id: invitation.id },
      data: { status: 'accepted' },
    })

    // Enviar email de confirmación al que invitó (opcional)
    try {
      const inviter = await prisma.user.findUnique({
        where: { id: invitation.invitedBy },
      })

      if (inviter) {
        await resend.emails.send({
          from: process.env.EMAIL_FROM || 'Bolsillos <onboarding@resend.dev>',
          to: inviter.email,
          subject: `¡${user.email} se unió a ${invitation.group.name}!`,
          html: `
            <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #10B981;">¡Genial!</h1>
              <p><strong>${user.email}</strong> aceptó tu invitación y se unió al grupo <strong>${invitation.group.name}</strong>.</p>
            </div>
          `,
        })
      }
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError)
    }

    return NextResponse.json({
      message: 'Invitación aceptada',
      group: invitation.group,
    })
  } catch (error) {
    console.error('Error accepting invitation:', error)
    return NextResponse.json(
      { error: 'Error al aceptar invitación' },
      { status: 500 }
    )
  }
}

// DELETE - Cancelar invitación pendiente
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { token } = await params

    const invitation = await findInvitation(token)

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitación no encontrada' },
        { status: 404 }
      )
    }

    // Verificar que el usuario sea owner del grupo
    const canEdit = await canUserEditGroup(user.id, invitation.groupId)
    if (!canEdit) {
      return NextResponse.json(
        { error: 'Solo el owner puede cancelar invitaciones' },
        { status: 403 }
      )
    }

    // Solo se pueden cancelar invitaciones pendientes
    if (invitation.status !== 'pending') {
      return NextResponse.json(
        { error: 'Esta invitación ya fue procesada' },
        { status: 400 }
      )
    }

    // Marcar como cancelada (o eliminar)
    await prisma.groupInvitation.update({
      where: { id: invitation.id },
      data: { status: 'cancelled' },
    })

    return NextResponse.json({ message: 'Invitación cancelada' })
  } catch (error) {
    console.error('Error canceling invitation:', error)
    return NextResponse.json(
      { error: 'Error al cancelar invitación' },
      { status: 500 }
    )
  }
}
