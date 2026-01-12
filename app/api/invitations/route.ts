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

    // Obtener información completa del usuario que invita
    const inviter = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
      },
    })

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
        const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${token}`
        const inviterName = inviter?.name || inviter?.email?.split('@')[0] || 'Un usuario'
        const inviterEmail = inviter?.email || user.email
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        
        // Versión de texto plano
        const textVersion = `
¡Hola!

${inviterName} te invitó a unirte al espacio "${group.name}" en Bolsillos.

Bolsillos es una aplicación para gestionar tus gastos e ingresos de forma sencilla y organizada.

Para aceptar la invitación, haz clic en el siguiente enlace:
${inviteUrl}

Este enlace expira en 7 días.

Si no esperabas este correo, puedes ignorarlo de forma segura.

---
Bolsillos - Organiza tus finanzas
${appUrl}
        `.trim()

        // Versión HTML profesional
        const htmlVersion = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Invitación a ${group.name}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f3f4f6;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border-collapse: collapse;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                💰 Bolsillos
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #111827; font-size: 24px; font-weight: 600; line-height: 1.3;">
                ¡Hola! 👋
              </h2>
              
              <p style="margin: 0 0 20px; color: #374151; font-size: 16px; line-height: 1.6;">
                <strong style="color: #111827;">${inviterName}</strong> te invitó a unirte al espacio <strong style="color: #10b981;">"${group.name}"</strong> en Bolsillos.
              </p>
              
              <p style="margin: 0 0 30px; color: #374151; font-size: 16px; line-height: 1.6;">
                Bolsillos es una aplicación para gestionar tus gastos e ingresos de forma sencilla y organizada. Podrás compartir gastos, establecer límites mensuales y mantener un control total de tus finanzas.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${inviteUrl}" 
                       style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                      Aceptar invitación →
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Alternative link -->
              <p style="margin: 30px 0 0; color: #6b7280; font-size: 14px; line-height: 1.5; text-align: center;">
                O copia y pega este enlace en tu navegador:<br>
                <a href="${inviteUrl}" style="color: #10b981; text-decoration: underline; word-break: break-all;">${inviteUrl}</a>
              </p>
              
              <!-- Expiration notice -->
              <div style="margin: 30px 0 0; padding: 16px; background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 4px;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                  ⏰ <strong>Importante:</strong> Este enlace expira en 7 días.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px; line-height: 1.5; text-align: center;">
                Si no esperabas este correo, puedes ignorarlo de forma segura.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5; text-align: center;">
                © ${new Date().getFullYear()} Bolsillos. Todos los derechos reservados.<br>
                <a href="${appUrl}" style="color: #10b981; text-decoration: none;">${appUrl}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `.trim()

        await resend.emails.send({
          from: process.env.EMAIL_FROM || 'Bolsillos <onboarding@resend.dev>',
          to: email,
          subject: `${inviterName} te invitó a "${group.name}" en Bolsillos`,
          text: textVersion,
          html: htmlVersion,
          replyTo: inviterEmail,
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
