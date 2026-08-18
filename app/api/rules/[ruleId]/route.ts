import { NextRequest, NextResponse } from 'next/server'
import { getAuthContext, canUserAccessGroup } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE - Borrar una regla
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ ruleId: string }> }) {
  try {
    const auth = await getAuthContext(request)
    if (!auth) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const { ruleId } = await params
    const rule = await prisma.categoryRule.findUnique({ where: { id: ruleId } })
    if (!rule) return NextResponse.json({ error: 'Regla no encontrada' }, { status: 404 })

    if (auth.type === 'token' && rule.groupId !== auth.groupId) {
      return NextResponse.json({ error: 'Este token no tiene acceso a ese grupo' }, { status: 403 })
    }
    if (!(await canUserAccessGroup(auth.userId, rule.groupId))) {
      return NextResponse.json({ error: 'No tienes acceso a este grupo' }, { status: 403 })
    }

    await prisma.categoryRule.delete({ where: { id: ruleId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting rule:', error)
    return NextResponse.json({ error: 'Error al borrar la regla' }, { status: 500 })
  }
}
