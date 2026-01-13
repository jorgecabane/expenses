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
