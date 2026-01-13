import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Cron job para resetear tareas de pago al inicio de cada mes
 * 
 * Configurar en vercel.json:
 *   "crons": [{
 *     "path": "/api/cron/reset-payment-tasks",
 *     "schedule": "0 0 1 * *"  // Primer día de cada mes a las 00:00 UTC
 *   }]
 */

export async function GET(request: NextRequest) {
  try {
    // Verificar que la request venga de Vercel Cron (solo en producción)
    if (process.env.NODE_ENV === 'production') {
      const authHeader = request.headers.get('authorization')
      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 401 }
        )
      }
    }

    const now = new Date()
    const currentMonth = now.getUTCMonth() + 1 // 1-12
    const currentYear = now.getUTCFullYear()

    console.log(`[Cron] Iniciando reset de tareas de pago para ${currentMonth}/${currentYear}`)

    // Obtener todas las tareas completadas que necesitan reset
    // Solo resetear si lastResetAt es del mes anterior o anterior
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear
    
    // Resetear todas las tareas completadas
    // Usamos updateMany para resetear todas las tareas completadas
    const result = await prisma.monthlyPaymentTask.updateMany({
      where: {
        isCompleted: true,
        // Solo resetear si no se ha reseteado este mes
        OR: [
          {
            lastResetAt: {
              lt: new Date(Date.UTC(currentYear, currentMonth - 1, 1)), // Antes del inicio del mes actual
            },
          },
        ],
      },
      data: {
        isCompleted: false,
        paidAmount: null,
        paidDate: null,
        completedBy: null,
        expenseId: null, // El gasto se mantiene (no se elimina), solo se desvincula
        lastResetAt: new Date(), // Actualizar timestamp de reset
      },
    })

    // También crear tareas para templates activos que no tienen tarea aún
    const allGroups = await prisma.familyGroup.findMany({
      select: { id: true },
    })

    let createdCount = 0
    for (const group of allGroups) {
      const templates = await prisma.paymentTemplate.findMany({
        where: {
          groupId: group.id,
          isActive: true,
        },
      })

      for (const template of templates) {
        // Verificar si ya existe una tarea para este template
        const existing = await prisma.monthlyPaymentTask.findUnique({
          where: {
            templateId_groupId: {
              templateId: template.id,
              groupId: group.id,
            },
          },
        })

        // Si no existe, crearla
        if (!existing) {
          await prisma.monthlyPaymentTask.create({
            data: {
              templateId: template.id,
              groupId: group.id,
              isCompleted: false,
              lastResetAt: new Date(),
            },
          })
          createdCount++
        }
      }
    }

    console.log(`[Cron] Reset completado: ${result.count} tareas reseteadas, ${createdCount} tareas nuevas creadas`)

    return NextResponse.json({
      success: true,
      resetCount: result.count,
      createdCount,
      month: currentMonth,
      year: currentYear,
    })
  } catch (error) {
    console.error('Error en cron job de reset de tareas de pago:', error)
    return NextResponse.json(
      { error: 'Error al resetear tareas de pago' },
      { status: 500 }
    )
  }
}
