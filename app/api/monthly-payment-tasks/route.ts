import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createExpense } from '@/lib/expenses'

// GET - Obtener tareas mensuales del grupo
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

    // Obtener todas las tareas del grupo (ahora son persistentes, no por mes)
    const tasks = await prisma.monthlyPaymentTask.findMany({
      where: {
        groupId,
      },
      include: {
        template: {
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
        },
        completer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { template: { estimatedDay: 'asc' } },
        { template: { name: 'asc' } },
      ],
    })

    // Obtener todos los templates activos para verificar si faltan tareas
    const allTemplates = await prisma.paymentTemplate.findMany({
      where: {
        groupId,
        isActive: true,
      },
    })

    // Si no hay tareas, crear automáticamente desde templates activos
    if (tasks.length === 0) {
      const templates = await prisma.paymentTemplate.findMany({
        where: {
          groupId,
          isActive: true,
        },
      })

      // Crear tareas para cada template (si no existen)
      const newTasks = await Promise.all(
        templates.map(async (template: { id: string }) => {
          // Verificar si ya existe
          const existing = await prisma.monthlyPaymentTask.findUnique({
            where: {
              templateId_groupId: {
                templateId: template.id,
                groupId,
              },
            },
          })
          
          if (existing) {
            return existing
          }
          
          // Crear nueva tarea
          return prisma.monthlyPaymentTask.create({
            data: {
              templateId: template.id,
              groupId,
              isCompleted: false,
            },
            include: {
              template: {
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
              },
              completer: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          })
        })
      )

      return NextResponse.json({ tasks: newTasks })
    }

    // Verificar si hay templates sin tarea y crearlas
    const templatesWithoutTask = allTemplates.filter((template: { id: string }) => 
      !tasks.some((task: { templateId: string }) => task.templateId === template.id)
    )

    if (templatesWithoutTask.length > 0) {
      // Crear tareas para templates que no tienen
      const missingTasks = await Promise.all(
        templatesWithoutTask.map(async (template: { id: string }) => {
          return prisma.monthlyPaymentTask.create({
            data: {
              templateId: template.id,
              groupId,
              isCompleted: false,
            },
            include: {
              template: {
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
              },
              completer: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          })
        })
      )

      // Combinar tareas existentes con las nuevas
      const allTasks = [...tasks, ...missingTasks].sort((a, b) => {
        const dayA = a.template.estimatedDay || 32
        const dayB = b.template.estimatedDay || 32
        if (dayA !== dayB) return dayA - dayB
        return a.template.name.localeCompare(b.template.name)
      })

      return NextResponse.json({ tasks: allTasks })
    }

    return NextResponse.json({ tasks })
  } catch (error) {
    console.error('Error fetching monthly payment tasks:', error)
    return NextResponse.json(
      { error: 'Error al obtener tareas mensuales' },
      { status: 500 }
    )
  }
}

// POST - Crear tarea manualmente (opcional, normalmente se crean automáticamente)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { groupId, templateId } = body

    if (!groupId || !templateId) {
      return NextResponse.json(
        { error: 'groupId y templateId son requeridos' },
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

    // Verificar que el template existe y pertenece al grupo
    const template = await prisma.paymentTemplate.findUnique({
      where: { id: templateId },
    })

    if (!template || template.groupId !== groupId) {
      return NextResponse.json(
        { error: 'Template no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si ya existe o crear nueva
    let task = await prisma.monthlyPaymentTask.findUnique({
      where: {
        templateId_groupId: {
          templateId,
          groupId,
        },
      },
      include: {
        template: {
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
        },
        completer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!task) {
      task = await prisma.monthlyPaymentTask.create({
        data: {
          templateId,
          groupId,
          isCompleted: false,
        },
        include: {
          template: {
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
          },
          completer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })
    }

    return NextResponse.json({ task }, { status: 201 })
  } catch (error) {
    console.error('Error creating monthly payment task:', error)
    return NextResponse.json(
      { error: 'Error al crear tarea mensual' },
      { status: 500 }
    )
  }
}
