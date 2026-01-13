import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Obtener templates de pagos del grupo
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

    // Obtener templates activos del grupo
    const templates = await prisma.paymentTemplate.findMany({
      where: {
        groupId,
        isActive: true,
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
      orderBy: [
        { estimatedDay: 'asc' },
        { name: 'asc' },
      ],
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error fetching payment templates:', error)
    return NextResponse.json(
      { error: 'Error al obtener templates de pagos' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo template de pago
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { groupId, name, defaultCategoryId, estimatedDay, estimatedAmount } = body

    if (!groupId || !name || !defaultCategoryId) {
      return NextResponse.json(
        { error: 'groupId, name y defaultCategoryId son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el grupo activo del usuario coincida con el grupo proporcionado
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { activeGroupId: true },
    })

    if (!dbUser?.activeGroupId) {
      return NextResponse.json(
        { error: 'No tienes un grupo activo. Por favor, selecciona un grupo primero.' },
        { status: 400 }
      )
    }

    if (dbUser.activeGroupId !== groupId) {
      return NextResponse.json(
        { error: 'El grupo proporcionado no coincide con tu grupo activo. Por favor, cambia al grupo correcto.' },
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

    // Verificar que la categoría existe y pertenece al grupo
    const category = await prisma.category.findUnique({
      where: { id: defaultCategoryId },
    })

    if (!category || category.groupId !== groupId) {
      return NextResponse.json(
        { error: 'Categoría no encontrada o no pertenece al grupo' },
        { status: 404 }
      )
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

    // Crear template
    const template = await prisma.paymentTemplate.create({
      data: {
        groupId,
        name: name.trim(),
        defaultCategoryId,
        estimatedDay: estimatedDay || null,
        estimatedAmount: estimatedAmount ? Number(estimatedAmount) : null,
        isActive: true,
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

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error('Error creating payment template:', error)
    return NextResponse.json(
      { error: 'Error al crear template de pago' },
      { status: 500 }
    )
  }
}
