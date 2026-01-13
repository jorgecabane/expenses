import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import AcceptInvitationForm from '@/components/AcceptInvitationForm'

async function getInvitation(token: string) {
  const invitation = await prisma.groupInvitation.findUnique({
    where: { token },
    include: {
      group: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  if (!invitation) return null
  if (invitation.status !== 'pending') return null
  if (invitation.expiresAt && invitation.expiresAt < new Date()) return null

  return invitation
}

async function acceptInvitation(invitationId: string, groupId: string, userId: string) {
  // Verificar si ya es miembro
  const existingMember = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId: groupId,
        userId: userId,
      },
    },
  })

  if (existingMember) {
    // Ya es miembro, solo marcar la invitación como aceptada
    await prisma.groupInvitation.update({
      where: { id: invitationId },
      data: { status: 'accepted' },
    })
    return { success: true, alreadyMember: true }
  }

  // Agregar como miembro
  await prisma.groupMember.create({
    data: {
      groupId: groupId,
      userId: userId,
      role: 'member',
    },
  })

  // Actualizar invitación
  await prisma.groupInvitation.update({
    where: { id: invitationId },
    data: { status: 'accepted' },
  })

  return { success: true, alreadyMember: false }
}

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const user = await getCurrentUser()
  const invitation = await getInvitation(token)

  if (!invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-500/20 flex items-center justify-center">
            <span className="text-4xl">🔗</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Link no válido</h1>
          <p className="mt-3 text-slate-400">
            Este link de invitación no existe, ha expirado o ya fue utilizado.
          </p>
          <Link
            href="/"
            className="inline-block mt-8 px-6 py-3 bg-slate-700 text-white font-medium rounded-xl hover:bg-slate-600 transition-colors"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    )
  }

  // Si el usuario ya está autenticado, aceptar automáticamente
  if (user) {
    const result = await acceptInvitation(invitation.id, invitation.groupId, user.id)
    
    if (result.success) {
      redirect('/dashboard')
    }
  }

  // Usuario no autenticado - mostrar página de invitación
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <AcceptInvitationForm 
        groupName={invitation.group.name}
        token={token} 
      />
    </div>
  )
}
