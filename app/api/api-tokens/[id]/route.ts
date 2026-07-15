import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE - Revocar un API token (no se borra, queda revocado para dejar rastro de auditoría)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id } = await params

    const apiToken = await prisma.apiToken.findUnique({ where: { id } })
    if (!apiToken) {
      return NextResponse.json({ error: 'Token no encontrado' }, { status: 404 })
    }

    if (apiToken.userId !== user.id) {
      return NextResponse.json({ error: 'No tienes permisos para revocar este token' }, { status: 403 })
    }

    await prisma.apiToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error revoking API token:', error)
    return NextResponse.json({ error: 'Error al revocar token' }, { status: 500 })
  }
}
