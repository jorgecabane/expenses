import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser, canUserEditCategory } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH - Actualizar categoría
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { categoryId } = await params

    const canEdit = await canUserEditCategory(user.id, categoryId)
    if (!canEdit) {
      return NextResponse.json(
        { error: 'No tienes permisos para editar esta categoría' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { name, icon, color, isPersonal, monthlyLimit } = body

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (icon !== undefined) updateData.icon = icon
    if (color !== undefined) updateData.color = color
    if (monthlyLimit !== undefined) updateData.monthlyLimit = monthlyLimit
    if (isPersonal !== undefined) {
      updateData.isPersonal = isPersonal
      updateData.ownerId = isPersonal ? user.id : null
    }

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      { error: 'Error al actualizar categoría' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar categoría (archivar)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { categoryId } = await params

    const canEdit = await canUserEditCategory(user.id, categoryId)
    if (!canEdit) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar esta categoría' },
        { status: 403 }
      )
    }

    // Por ahora eliminamos, pero en el futuro podríamos archivar
    await prisma.category.delete({
      where: { id: categoryId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Error al eliminar categoría' },
      { status: 500 }
    )
  }
}
