import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createExpense } from '@/lib/expenses'

// PATCH - Checkear/descheckear tarea de pago
export async function PATCH(
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
    const { isCompleted, paidAmount, createExpense: shouldCreateExpense } = body

    // Obtener tarea
    const task = await prisma.monthlyPaymentTask.findUnique({
      where: { id },
      include: {
        template: {
          include: {
            category: true,
          },
        },
        group: {
          include: {
            members: true,
          },
        },
        expense: true,
      },
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Tarea no encontrada' },
        { status: 404 }
      )
    }

    // Verificar que el usuario sea miembro del grupo
    const membership = task.group.members.find((m: { userId: string }) => m.userId === user.id)
    if (!membership) {
      return NextResponse.json(
        { error: 'No eres miembro de este grupo' },
        { status: 403 }
      )
    }

    // Si se está marcando como completada
    if (isCompleted === true) {
      if (!paidAmount || paidAmount <= 0) {
        return NextResponse.json(
          { error: 'paidAmount es requerido y debe ser mayor a 0' },
          { status: 400 }
        )
      }

      let expenseId: string | null = null

      // Crear gasto si se solicita o si está configurado en el grupo
      if (shouldCreateExpense || task.group.autoCreateExpensesFromReminders) {
        // Verificar el grupo activo del usuario
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
        
        // Verificar que el grupo activo del usuario coincida con el grupo del recordatorio
        if (dbUser.activeGroupId !== task.groupId) {
          return NextResponse.json(
            { error: 'El recordatorio pertenece a un grupo diferente al grupo activo. Por favor, cambia al grupo correcto para crear el gasto.' },
            { status: 400 }
          )
        }
        
        if (!task.template.defaultCategoryId) {
          return NextResponse.json(
            { error: 'El template no tiene una categoría por defecto configurada' },
            { status: 400 }
          )
        }
        
        // Verificar que la categoría pertenezca al grupo activo (que ahora sabemos que coincide con task.groupId)
        const category = await prisma.category.findUnique({
          where: { id: task.template.defaultCategoryId },
          select: { id: true, groupId: true },
        })
        
        if (!category || category.groupId !== dbUser.activeGroupId) {
          return NextResponse.json(
            { error: 'La categoría del template no pertenece al grupo activo' },
            { status: 400 }
          )
        }
        
        try {
          const expenseDate = new Date()
          const expense = await createExpense(
            dbUser.activeGroupId, // Usar el grupo activo del usuario, no el grupo del recordatorio
            task.template.defaultCategoryId,
            Number(paidAmount),
            task.template.name,
            expenseDate, // Fecha actual
            user.id,
            false, // No es recurrente
            null
          )
          expenseId = expense.id
        } catch (expenseError) {
          console.error('Error creating expense from reminder:', expenseError)
          // Continuar aunque falle la creación del gasto
        }
      }

      // Actualizar tarea como completada
      const updatedTask = await prisma.monthlyPaymentTask.update({
        where: { id },
        data: {
          isCompleted: true,
          paidAmount: Number(paidAmount),
          paidDate: new Date(),
          completedBy: user.id,
          expenseId,
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
          expense: true,
        },
      })

      return NextResponse.json({ task: updatedTask })
    }

    // Si se está desmarcando como completada
    if (isCompleted === false) {
      // Actualizar tarea como no completada
      // Nota: No eliminamos el gasto asociado, solo desmarcamos la tarea
      // El gasto seguirá existiendo en el sistema
      const updatedTask = await prisma.monthlyPaymentTask.update({
        where: { id },
        data: {
          isCompleted: false,
          paidAmount: null,
          paidDate: null,
          completedBy: null,
          expenseId: null, // Limpiamos la referencia pero no eliminamos el gasto
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
          expense: true,
        },
      })

      return NextResponse.json({ task: updatedTask })
    }

    return NextResponse.json(
      { error: 'isCompleted debe ser true o false' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating monthly payment task:', error)
    return NextResponse.json(
      { error: 'Error al actualizar tarea mensual' },
      { status: 500 }
    )
  }
}
