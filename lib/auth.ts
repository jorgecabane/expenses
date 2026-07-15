import { createHash } from 'crypto'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

/**
 * Obtiene el usuario actual desde Supabase Auth
 */
export async function getCurrentUser() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return null
    }

    // Sincronizar usuario con nuestra BD si no existe
    try {
      await prisma.user.upsert({
        where: { id: user.id },
        create: {
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.name || user.email?.split('@')[0] || null,
          avatarUrl: user.user_metadata?.avatar_url || null,
        },
        update: {
          email: user.email!,
          name: user.user_metadata?.name || user.email?.split('@')[0] || null,
          avatarUrl: user.user_metadata?.avatar_url || null,
        },
      })
    } catch (error) {
      console.error('Error syncing user with DB:', error)
      // No lanzar error, solo loguear - el usuario puede seguir usando la app
    }

    return user
  } catch (error) {
    console.error('getCurrentUser: Unexpected error:', error)
    return null
  }
}

/**
 * Hashea un API token para almacenamiento/lookup (nunca se guarda en texto plano)
 */
export function hashApiToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/**
 * Resuelve identidad desde un header `Authorization: Bearer <token>`.
 * Devuelve null si no hay header, el token es inválido, o fue revocado.
 */
export async function getApiTokenAuth(
  request: NextRequest
): Promise<{ userId: string; groupId: string; tokenId: string } | null> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.slice('Bearer '.length).trim()
  if (!token) return null

  const tokenHash = hashApiToken(token)
  const apiToken = await prisma.apiToken.findUnique({ where: { tokenHash } })

  if (!apiToken || apiToken.revokedAt) return null

  await prisma.apiToken.update({
    where: { id: apiToken.id },
    data: { lastUsedAt: new Date() },
  })

  return { userId: apiToken.userId, groupId: apiToken.groupId, tokenId: apiToken.id }
}

/**
 * Resuelve identidad para un endpoint que acepta tanto sesión (cookie, uso desde la UI)
 * como API token (uso programático). El token, cuando está presente, siempre gana y
 * fija el groupId — un cliente programático nunca puede operar fuera del espacio
 * al que su token quedó atado.
 */
export async function getAuthContext(
  request: NextRequest
): Promise<{ type: 'token'; userId: string; groupId: string } | { type: 'session'; userId: string } | null> {
  const tokenAuth = await getApiTokenAuth(request)
  if (tokenAuth) {
    return { type: 'token', userId: tokenAuth.userId, groupId: tokenAuth.groupId }
  }

  const user = await getCurrentUser()
  if (!user) return null

  return { type: 'session', userId: user.id }
}

/**
 * Verifica si el usuario puede acceder a un grupo
 */
export async function canUserAccessGroup(userId: string, groupId: string): Promise<boolean> {
  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId,
      },
    },
  })

  return !!membership
}

/**
 * Verifica si el usuario puede editar un grupo (es owner)
 */
export async function canUserEditGroup(userId: string, groupId: string): Promise<boolean> {
  const membership = await prisma.groupMember.findFirst({
    where: {
      groupId,
      userId,
      role: 'owner',
    },
  })

  return !!membership
}

/**
 * Verifica si el usuario puede acceder a una categoría
 */
export async function canUserAccessCategory(userId: string, categoryId: string): Promise<boolean> {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      group: {
        include: {
          members: true,
        },
      },
    },
  })

  if (!category) return false

  // Verificar si el usuario es miembro del grupo
  const isMember = category.group.members.some((m: { userId: string }) => m.userId === userId)
  if (!isMember) return false

  // Si es personal, verificar que el usuario es el dueño
  if (category.isPersonal && category.ownerId !== userId) {
    return false // No puede editar, pero puede ver (transparencia)
  }

  return true
}

/**
 * Verifica si el usuario puede editar una categoría
 * - Categorías compartidas: cualquier miembro del grupo puede editar
 * - Categorías personales: solo el ownerId puede editar
 */
export async function canUserEditCategory(userId: string, categoryId: string): Promise<boolean> {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
  })

  if (!category) return false

  // Si es compartida, cualquier miembro del grupo puede editar
  if (!category.isPersonal) {
    return canUserAccessGroup(userId, category.groupId)
  }

  // Si es personal, solo el dueño de la categoría puede editar
  return category.ownerId === userId
}

/**
 * Obtiene el rol del usuario en un grupo
 */
export async function getUserRoleInGroup(userId: string, groupId: string): Promise<'owner' | 'member' | null> {
  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId,
      },
    },
  })

  if (!membership) return null
  return membership.role as 'owner' | 'member'
}
