import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, canUserEditGroup } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { resend } from '@/lib/resend'
import { randomBytes } from 'crypto'

// GET - Obtener invitaciones pendientes de un grupo
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

    // Verificar que el usuario sea miembro del grupo
    const membership = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: user.id,
        },
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'No eres miembro de este grupo' },
        { status: 403 }
      )
    }

    // Obtener invitaciones pendientes
    const invitations = await prisma.groupInvitation.findMany({
      where: {
        groupId,
        status: 'pending',
      },
      include: {
        inviter: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Agregar el link de invitación a cada una
    const invitationsWithLinks = invitations.map((inv) => ({
      ...inv,
      inviteLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${inv.token}`,
      isExpired: inv.expiresAt ? inv.expiresAt < new Date() : false,
    }))

    return NextResponse.json({ invitations: invitationsWithLinks })
  } catch (error) {
    console.error('Error fetching invitations:', error)
    return NextResponse.json(
      { error: 'Error al obtener invitaciones' },
      { status: 500 }
    )
  }
}

// POST - Crear invitación
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { groupId, email, sendEmail = true } = body

    if (!groupId || !email) {
      return NextResponse.json(
        { error: 'groupId y email son requeridos' },
        { status: 400 }
      )
    }

    const canEdit = await canUserEditGroup(user.id, groupId)
    if (!canEdit) {
      return NextResponse.json(
        { error: 'Solo el owner puede invitar miembros' },
        { status: 403 }
      )
    }

    // Verificar que el email no esté ya en el grupo
    const group = await prisma.familyGroup.findUnique({
      where: { id: groupId },
      include: {
        members: true,
      },
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Grupo no encontrado' },
        { status: 404 }
      )
    }

    const existingMember = group.members.find(
      (m) => m.userId === email // Esto debería verificar por email del usuario
    )

    // Generar token único y fecha de expiración
    const token = randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // Expira en 7 días

    // Crear o actualizar invitación (upsert)
    const invitation = await prisma.groupInvitation.upsert({
      where: {
        groupId_email: {
          groupId,
          email,
        },
      },
      update: {
        token,
        expiresAt,
        status: 'pending',
        invitedBy: user.id,
      },
      create: {
        groupId,
        email,
        token,
        invitedBy: user.id,
        expiresAt,
        status: 'pending',
      },
    })

    // Enviar email si se solicita
    if (sendEmail) {
      try {
        await resend.emails.send({
          from: process.env.EMAIL_FROM || 'Bolsillos <onboarding@resend.dev>',
          to: email,
          subject: `${group.name} te invitó a unirte en Bolsillos`,
          html: `
            <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #10B981;">¡Hola!</h1>
              <p>${user.email} te invitó a unirte al grupo <strong>${group.name}</strong> en Bolsillos.</p>
              <p>Haz click en el botón para aceptar la invitación:</p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${token}" 
                 style="display: inline-block; padding: 12px 24px; background-color: #10B981; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">
                Aceptar invitación
              </a>
              <p style="color: #6B7280; font-size: 14px; margin-top: 20px;">
                Este link expira en 7 días.
              </p>
            </div>
          `,
        })
      } catch (emailError) {
        console.error('Error sending email:', emailError)
        // Continuar aunque falle el email, el link se puede compartir manualmente
      }
    }

    return NextResponse.json(
      {
        invitation: {
          ...invitation,
          inviteLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${token}`,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating invitation:', error)
    return NextResponse.json(
      { error: 'Error al crear invitación' },
      { status: 500 }
    )
  }
}
