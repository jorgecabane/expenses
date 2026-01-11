/**
 * Utilidades para manejar recurrencias
 */

export interface RecurringConfig {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'
  interval?: number
  intervalUnit?: 'day' | 'week' | 'month' | 'year'
  days?: number[] | { ordinal: number; dayOfWeek: number } | { month: number; day: number }
  endType: 'never' | 'on_date' | 'after'
  endDate?: string
  endAfter?: number
  startDate: string
  isPaused?: boolean
  lastProcessed?: string
}

export interface QuickRecurrenceOption {
  label: string
  value: string
  config: RecurringConfig
}

const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MONTH_NAMES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
]
const ORDINAL_NAMES = ['primer', 'segundo', 'tercer', 'cuarto', 'último']

/**
 * Calcula el ordinal de un día en el mes (1er, 2do, 3er, 4to, último)
 */
function getOrdinalInMonth(date: Date): number {
  const dayOfMonth = date.getDate()
  const dayOfWeek = date.getDay()
  
  // Contar cuántas veces aparece este día de la semana antes de esta fecha
  let count = 0
  for (let day = 1; day <= dayOfMonth; day++) {
    const testDate = new Date(date.getFullYear(), date.getMonth(), day)
    if (testDate.getDay() === dayOfWeek) {
      count++
    }
  }
  
  // Si es el último, verificar si hay más ocurrencias después
  const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  let isLast = true
  for (let day = dayOfMonth + 7; day <= lastDayOfMonth; day += 7) {
    const testDate = new Date(date.getFullYear(), date.getMonth(), day)
    if (testDate.getDay() === dayOfWeek) {
      isLast = false
      break
    }
  }
  
  return isLast ? 5 : count // 5 = último
}

/**
 * Genera opciones rápidas de recurrencia basadas en una fecha
 */
export function generateQuickRecurrenceOptions(selectedDate: Date): QuickRecurrenceOption[] {
  const dayOfWeek = selectedDate.getDay()
  const dayOfMonth = selectedDate.getDate()
  const month = selectedDate.getMonth()
  const year = selectedDate.getFullYear()
  const dayName = DAY_NAMES[dayOfWeek]
  const monthName = MONTH_NAMES[month]
  
  const ordinal = getOrdinalInMonth(selectedDate)
  const ordinalName = ORDINAL_NAMES[ordinal - 1] || 'último'
  
  const startDateISO = selectedDate.toISOString()
  
  return [
    {
      label: 'Cada día',
      value: 'daily',
      config: {
        type: 'daily',
        endType: 'never',
        startDate: startDateISO,
      },
    },
    {
      label: `Cada semana el ${dayName}`,
      value: 'weekly',
      config: {
        type: 'weekly',
        days: [dayOfWeek],
        endType: 'never',
        startDate: startDateISO,
      },
    },
    {
      label: `Cada mes el ${ordinalName} ${dayName}`,
      value: 'monthly_ordinal',
      config: {
        type: 'monthly',
        days: { ordinal, dayOfWeek },
        endType: 'never',
        startDate: startDateISO,
      },
    },
    {
      label: `Anualmente el ${dayOfMonth} de ${monthName}`,
      value: 'yearly',
      config: {
        type: 'yearly',
        days: { month: month + 1, day: dayOfMonth },
        endType: 'never',
        startDate: startDateISO,
      },
    },
    {
      label: 'Personalizar...',
      value: 'custom',
      config: {
        type: 'custom',
        interval: 1,
        intervalUnit: 'week',
        days: [dayOfWeek],
        endType: 'never',
        startDate: startDateISO,
      },
    },
  ]
}

/**
 * Formatea una configuración de recurrencia para mostrar al usuario
 */
export function formatRecurrenceConfig(config: RecurringConfig): string {
  if (!config) return 'No recurrente'
  
  switch (config.type) {
    case 'daily':
      return 'Cada día'
    case 'weekly':
      if (Array.isArray(config.days) && config.days.length > 0) {
        const dayNames = config.days.map(d => DAY_NAMES[d]).join(', ')
        return `Cada semana el ${dayNames}`
      }
      return 'Cada semana'
    case 'monthly':
      if (typeof config.days === 'object' && 'ordinal' in config.days) {
        const ordinalName = ORDINAL_NAMES[config.days.ordinal - 1] || 'último'
        const dayName = DAY_NAMES[config.days.dayOfWeek]
        return `Cada mes el ${ordinalName} ${dayName}`
      }
      if (Array.isArray(config.days)) {
        return `Cada mes los días ${config.days.join(', ')}`
      }
      return 'Cada mes'
    case 'yearly':
      if (typeof config.days === 'object' && 'month' in config.days) {
        const monthName = MONTH_NAMES[config.days.month - 1]
        return `Anualmente el ${config.days.day} de ${monthName}`
      }
      return 'Anualmente'
    case 'custom':
      const unit = config.intervalUnit === 'day' ? 'día' :
                   config.intervalUnit === 'week' ? 'semana' :
                   config.intervalUnit === 'month' ? 'mes' : 'año'
      return `Cada ${config.interval} ${unit}${config.interval! > 1 ? 's' : ''}`
    default:
      return 'Recurrente'
  }
}

/**
 * Verifica si una fecha corresponde a una recurrencia diaria
 */
function matchesDaily(startDate: Date, checkDate: Date): boolean {
  // Para daily, siempre corresponde si la fecha es >= startDate
  return checkDate >= startDate
}

/**
 * Verifica si una fecha corresponde a una recurrencia semanal
 */
function matchesWeekly(config: RecurringConfig, startDate: Date, checkDate: Date): boolean {
  if (!Array.isArray(config.days) || config.days.length === 0) return false
  
  // Verificar que la fecha sea >= startDate
  if (checkDate < startDate) return false
  
  // Verificar que el día de la semana esté en la lista
  return config.days.includes(checkDate.getDay())
}

/**
 * Verifica si una fecha corresponde a una recurrencia mensual
 */
function matchesMonthly(config: RecurringConfig, startDate: Date, checkDate: Date): boolean {
  if (checkDate < startDate) return false
  
  // Caso 1: Día específico del mes (ej: día 15)
  if (Array.isArray(config.days)) {
    return config.days.includes(checkDate.getDate())
  }
  
  // Caso 2: Ordinal + día de semana (ej: segundo sábado)
  if (typeof config.days === 'object' && 'ordinal' in config.days) {
    const { ordinal, dayOfWeek } = config.days
    const checkOrdinal = getOrdinalInMonth(checkDate)
    const checkDayOfWeek = checkDate.getDay()
    
    // Verificar que sea el mismo día de la semana
    if (checkDayOfWeek !== dayOfWeek) return false
    
    // Verificar el ordinal (1-4 o 5 para último)
    return checkOrdinal === ordinal
  }
  
  return false
}

/**
 * Verifica si una fecha corresponde a una recurrencia anual
 */
function matchesYearly(config: RecurringConfig, startDate: Date, checkDate: Date): boolean {
  if (checkDate < startDate) return false
  
  if (typeof config.days === 'object' && 'month' in config.days) {
    const { month, day } = config.days
    // month es 1-12, day es 1-31
    return checkDate.getMonth() + 1 === month && checkDate.getDate() === day
  }
  
  return false
}

/**
 * Verifica si una fecha corresponde a una recurrencia personalizada
 */
function matchesCustom(config: RecurringConfig, startDate: Date, checkDate: Date): boolean {
  if (checkDate < startDate) return false
  
  const interval = config.interval || 1
  const intervalUnit = config.intervalUnit || 'week'
  
  // Calcular días transcurridos desde startDate
  const diffTime = checkDate.getTime() - startDate.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  switch (intervalUnit) {
    case 'day':
      return diffDays % interval === 0
    case 'week':
      // Verificar que sea un múltiplo de semanas y que el día de la semana coincida
      const weeksDiff = Math.floor(diffDays / 7)
      if (weeksDiff % interval !== 0) return false
      
      // Si hay días específicos, verificar que coincida
      if (Array.isArray(config.days) && config.days.length > 0) {
        return config.days.includes(checkDate.getDay())
      }
      // Si no hay días específicos, cualquier día de la semana está bien
      return true
    case 'month':
      // Calcular diferencia en meses
      const monthsDiff = (checkDate.getFullYear() - startDate.getFullYear()) * 12 +
                        (checkDate.getMonth() - startDate.getMonth())
      if (monthsDiff % interval !== 0) return false
      
      // Si hay días específicos, verificar que coincida
      if (Array.isArray(config.days) && config.days.length > 0) {
        return config.days.includes(checkDate.getDate())
      }
      // Si no hay días específicos, cualquier día del mes está bien
      return true
    case 'year':
      // Calcular diferencia en años
      const yearsDiff = checkDate.getFullYear() - startDate.getFullYear()
      if (yearsDiff % interval !== 0) return false
      
      // Verificar mes y día
      if (typeof config.days === 'object' && 'month' in config.days) {
        return checkDate.getMonth() + 1 === config.days.month &&
               checkDate.getDate() === config.days.day
      }
      return checkDate.getMonth() === startDate.getMonth() &&
             checkDate.getDate() === startDate.getDate()
    default:
      return false
  }
}

/**
 * Verifica si una fecha debe generar una transacción según la configuración de recurrencia
 * @param config Configuración de recurrencia
 * @param checkDate Fecha a verificar (normalmente hoy)
 * @returns true si debe generarse una transacción en checkDate
 */
export function shouldGenerateTransaction(
  config: RecurringConfig,
  checkDate: Date = new Date()
): boolean {
  // Si está pausado, no generar
  if (config.isPaused) return false
  
  // Parsear startDate en hora local para evitar problemas UTC
  const [year, month, day] = config.startDate.split('T')[0].split('-').map(Number)
  const start = new Date(year, month - 1, day)
  const targetDate = checkDate || new Date()
  
  // Normalizar fechas a medianoche para comparaciones
  const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())
  
  // Verificar condiciones de fin
  if (config.endType === 'on_date' && config.endDate) {
    const endDate = new Date(config.endDate)
    const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
    if (target > end) return false
  }
  
  // Nota: Para endType === 'after', necesitamos contar transacciones generadas
  // Esto se manejará en el cron job que llama a esta función
  
  // Verificar que la fecha sea >= startDate
  if (target < start) return false
  
  // Verificar según el tipo de recurrencia
  switch (config.type) {
    case 'daily':
      return matchesDaily(start, target)
    case 'weekly':
      return matchesWeekly(config, start, target)
    case 'monthly':
      return matchesMonthly(config, start, target)
    case 'yearly':
      return matchesYearly(config, start, target)
    case 'custom':
      return matchesCustom(config, start, target)
    default:
      return false
  }
}

/**
 * Calcula la próxima fecha en que debe generarse una transacción
 * @param config Configuración de recurrencia
 * @param fromDate Fecha desde la cual calcular (normalmente hoy o lastProcessed)
 * @returns Próxima fecha o null si no hay más fechas
 */
export function getNextRecurrenceDate(
  config: RecurringConfig,
  fromDate: Date = new Date()
): Date | null {
  if (config.isPaused) return null
  
  const startDate = new Date(config.startDate)
  const from = new Date(fromDate)
  
  // Verificar condiciones de fin
  if (config.endType === 'on_date' && config.endDate) {
    const endDate = new Date(config.endDate)
    if (from >= endDate) return null
  }
  
  // Buscar la próxima fecha válida (máximo 2 años en el futuro para evitar loops infinitos)
  const maxDate = new Date(from)
  maxDate.setFullYear(maxDate.getFullYear() + 2)
  
  let currentDate = new Date(from)
  currentDate.setDate(currentDate.getDate() + 1) // Empezar desde mañana
  
  while (currentDate <= maxDate) {
    if (shouldGenerateTransaction(config, currentDate)) {
      return currentDate
    }
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return null
}

/**
 * Cuenta cuántas transacciones se han generado hasta una fecha
 * Nota: Esta función requiere acceso a la base de datos, se implementará en el cron job
 */
export function countGeneratedTransactions(
  config: RecurringConfig,
  untilDate: Date = new Date()
): number {
  // Esta función se implementará en el cron job donde tenemos acceso a Prisma
  // Por ahora retornamos 0 como placeholder
  return 0
}
