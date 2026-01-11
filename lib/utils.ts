import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parsea una fecha ISO string o Date a un Date en UTC a medianoche
 * Evita problemas de conversión UTC que pueden desplazar la fecha un día
 * @param dateString - Fecha en formato ISO string (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss.sssZ) o Date
 * @returns Date en UTC a medianoche (00:00:00 UTC)
 */
export function parseLocalDate(dateString: string | Date): Date {
  if (dateString instanceof Date) {
    // Si ya es un Date, extraer año, mes y día en UTC y crear uno nuevo en UTC
    const year = dateString.getUTCFullYear()
    const month = dateString.getUTCMonth()
    const day = dateString.getUTCDate()
    return new Date(Date.UTC(year, month, day))
  }
  
  // Si es un string ISO con solo la fecha (YYYY-MM-DD), parsear manualmente en UTC
  if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [year, month, day] = dateString.split('-').map(Number)
    return new Date(Date.UTC(year, month - 1, day))
  }
  
  // Si es un string ISO completo, extraer solo la parte de fecha (YYYY-MM-DD) y parsear en UTC
  const dateMatch = dateString.match(/^(\d{4}-\d{2}-\d{2})/)
  if (dateMatch) {
    const [year, month, day] = dateMatch[1].split('-').map(Number)
    return new Date(Date.UTC(year, month - 1, day))
  }
  
  // Fallback: parsear como Date normal y luego convertir a UTC medianoche
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = date.getMonth()
  const day = date.getDate()
  return new Date(Date.UTC(year, month, day))
}
