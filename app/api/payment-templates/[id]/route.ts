import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PUT - Actualizar template de pago
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, defaultCategoryId, estimatedDay, estimatedAmount, isActive } = body

    // Obtener template
    const template = await prisma.paymentTemplate.findUnique({
      where: { id },
      include: {
        group: {
          include: {
            members: true,
          },
        },
      },
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Template no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el usuario sea miembro del grupo
    const membership = template.group.members.find((m: { userId: string }) => m.userId === user.id)
    if (!membership) {
      return NextResponse.json(
        { error: 'No eres miembro de este grupo' },
        { status: 403 }
      )
    }

    // Validar defaultCategoryId si se proporciona
    if (defaultCategoryId && defaultCategoryId !== template.defaultCategoryId) {
      const category = await prisma.category.findUnique({
        where: { id: defaultCategoryId },
      })

      if (!category || category.groupId !== template.groupId) {
        return NextResponse.json(
          { error: 'Categoría no encontrada o no pertenece al grupo' },
          { status: 404 }
        )
      }
    }

    // Validar estimatedDay si se proporciona
    if (estimatedDay !== undefined && estimatedDay !== null) {
      if (estimatedDay < 1 || estimatedDay > 31) {
        return NextResponse.json(
          { error: 'estimatedDay debe estar entre 1 y 31' },
          { status: 400 }
        )
      }
    }

    // Actualizar template
    const updatedTemplate = await prisma.paymentTemplate.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(defaultCategoryId !== undefined && { defaultCategoryId }),
        ...(estimatedDay !== undefined && { estimatedDay: estimatedDay || null }),
        ...(estimatedAmount !== undefined && { estimatedAmount: estimatedAmount ? Number(estimatedAmount) : null }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            color: true,
          },
        },
      },
    })

    return NextResponse.json({ template: updatedTemplate })
  } catch (error) {
    console.error('Error updating payment template:', error)
    return NextResponse.json(
      { error: 'Error al actualizar template de pago' },
      { status: 500 }
    )
  }
}

// DELETE - Eliminar template de pago (soft delete: isActive = false)
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

    // Obtener template
    const template = await prisma.paymentTemplate.findUnique({
      where: { id },
      include: {
        group: {
          include: {
            members: true,
          },
        },
      },
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Template no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el usuario sea miembro del grupo
    const membership = template.group.members.find((m: { userId: string }) => m.userId === user.id)
    if (!membership) {
      return NextResponse.json(
        { error: 'No eres miembro de este grupo' },
        { status: 403 }
      )
    }

    // Soft delete: marcar como inactivo
    await prisma.paymentTemplate.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ message: 'Template eliminado' })
  } catch (error) {
    console.error('Error deleting payment template:', error)
    return NextResponse.json(
      { error: 'Error al eliminar template de pago' },
      { status: 500 }
    )
  }
}
