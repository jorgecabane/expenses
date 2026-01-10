import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { shouldGenerateTransaction, getNextRecurrenceDate } from '@/lib/recurrence'
import type { RecurringConfig } from '@/lib/recurrence'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Cron job para generar transacciones recurrentes
 * Ejecutar diariamente a las 00:00 UTC
 * 
 * Configurar en vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/recurring-transactions",
 *     "schedule": "0 0 * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  // Verificar que la request venga de Vercel Cron (solo en producción)
  // En desarrollo, permitir sin autenticación para testing
  if (process.env.NODE_ENV === 'production') {
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0) // Normalizar a medianoche

  const results = {
    expensesProcessed: 0,
    expensesCreated: 0,
    incomesProcessed: 0,
    incomesCreated: 0,
    errors: [] as string[],
  }

  try {
    // Procesar gastos recurrentes
    const recurringExpenses = await prisma.expense.findMany({
      where: {
        isRecurring: true,
      },
      include: {
        category: true,
        creator: true,
      },
    })

    for (const expense of recurringExpenses) {
      try {
        results.expensesProcessed++
        
        const config = expense.recurringConfig as RecurringConfig | null
        if (!config) continue

        // Verificar si está pausado
        if (config.isPaused) continue

        // Verificar condiciones de fin
        if (config.endType === 'on_date' && config.endDate) {
          const endDate = new Date(config.endDate)
          endDate.setHours(0, 0, 0, 0)
          if (today > endDate) continue
        }

        // Verificar si debe generarse hoy
        if (!shouldGenerateTransaction(config, today)) continue

        // Verificar que no exista ya una transacción para hoy
        const existingExpense = await prisma.expense.findFirst({
          where: {
            groupId: expense.groupId,
            categoryId: expense.categoryId,
            createdBy: expense.createdBy,
            date: {
              gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
              lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
            },
            // Verificar que sea una transacción generada (mismo monto y descripción)
            amount: expense.amount,
            description: expense.description,
          },
        })

        if (existingExpense) continue

        // Verificar condición de fin "after" contando transacciones generadas
        if (config.endType === 'after' && config.endAfter) {
          const generatedCount = await prisma.expense.count({
            where: {
              groupId: expense.groupId,
              categoryId: expense.categoryId,
              createdBy: expense.createdBy,
              amount: expense.amount,
              description: expense.description,
              date: {
                gte: new Date(config.startDate),
              },
            },
          })

          // +1 porque vamos a crear una nueva
          if (generatedCount + 1 >= config.endAfter) continue
        }

        // Crear nueva transacción
        await prisma.expense.create({
          data: {
            groupId: expense.groupId,
            categoryId: expense.categoryId,
            amount: expense.amount,
            description: expense.description,
            date: today,
            createdBy: expense.createdBy,
            isRecurring: false, // Las transacciones generadas NO son recurrentes
          },
        })

        results.expensesCreated++

        // Actualizar lastProcessed en el template
        const updatedConfig: RecurringConfig = {
          ...config,
          lastProcessed: today.toISOString(),
        }

        await prisma.expense.update({
          where: { id: expense.id },
          data: {
            recurringConfig: updatedConfig as any,
          },
        })
      } catch (error) {
        const errorMsg = `Error procesando gasto ${expense.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        results.errors.push(errorMsg)
        console.error(errorMsg, error)
      }
    }

    // Procesar ingresos recurrentes
    const recurringIncomes = await prisma.income.findMany({
      where: {
        isRecurring: true,
      },
      include: {
        creator: true,
      },
    })

    for (const income of recurringIncomes) {
      try {
        results.incomesProcessed++
        
        const config = income.recurringConfig as RecurringConfig | null
        if (!config) continue

        // Verificar si está pausado
        if (config.isPaused) continue

        // Verificar condiciones de fin
        if (config.endType === 'on_date' && config.endDate) {
          const endDate = new Date(config.endDate)
          endDate.setHours(0, 0, 0, 0)
          if (today > endDate) continue
        }

        // Verificar si debe generarse hoy
        if (!shouldGenerateTransaction(config, today)) continue

        // Verificar que no exista ya una transacción para hoy
        const existingIncome = await prisma.income.findFirst({
          where: {
            groupId: income.groupId,
            userId: income.userId,
            createdBy: income.createdBy,
            date: {
              gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
              lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
            },
            // Verificar que sea una transacción generada (mismo monto y descripción)
            amount: income.amount,
            description: income.description,
          },
        })

        if (existingIncome) continue

        // Verificar condición de fin "after" contando transacciones generadas
        if (config.endType === 'after' && config.endAfter) {
          const generatedCount = await prisma.income.count({
            where: {
              groupId: income.groupId,
              userId: income.userId,
              createdBy: income.createdBy,
              amount: income.amount,
              description: income.description,
              date: {
                gte: new Date(config.startDate),
              },
            },
          })

          // +1 porque vamos a crear una nueva
          if (generatedCount + 1 >= config.endAfter) continue
        }

        // Crear nueva transacción
        await prisma.income.create({
          data: {
            groupId: income.groupId,
            userId: income.userId,
            amount: income.amount,
            description: income.description,
            date: today,
            createdBy: income.createdBy,
            isRecurring: false, // Las transacciones generadas NO son recurrentes
          },
        })

        results.incomesCreated++

        // Actualizar lastProcessed en el template
        const updatedConfig: RecurringConfig = {
          ...config,
          lastProcessed: today.toISOString(),
        }

        await prisma.income.update({
          where: { id: income.id },
          data: {
            recurringConfig: updatedConfig as any,
          },
        })
      } catch (error) {
        const errorMsg = `Error procesando ingreso ${income.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        results.errors.push(errorMsg)
        console.error(errorMsg, error)
      }
    }

    return NextResponse.json({
      success: true,
      date: today.toISOString(),
      ...results,
    })
  } catch (error) {
    console.error('Error en cron job de transacciones recurrentes:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        ...results,
      },
      { status: 500 }
    )
  }
}
