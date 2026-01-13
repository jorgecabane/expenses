import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Para desarrollo: usar connection directa (sin pooler)
// Para producción: usar pooler (mejor rendimiento)
const connectionString = 
  process.env.DATABASE_URL || 
  (process.env.NODE_ENV === 'development' 
    ? process.env.POSTGRES_URL_NON_POOLING 
    : process.env.POSTGRES_PRISMA_URL) || 
  ''

// Configurar Pool para Supabase
// Nota: El pooler de Supabase (pgbouncer) requiere configuración especial
const poolConfig: {
  connectionString: string
  max?: number
  idleTimeoutMillis?: number
  connectionTimeoutMillis?: number
  ssl?: boolean | {
    rejectUnauthorized?: boolean
    require?: boolean
  }
} = {
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 30000, // Aumentado a 30 segundos para evitar timeouts
  // Para Supabase, necesitamos SSL pero con rejectUnauthorized: false
  // Esto es necesario porque Supabase usa certificados auto-firmados
  ssl: (connectionString.includes('supabase.co') || connectionString.includes('supabase'))
    ? {
        rejectUnauthorized: false,
        require: true,
      }
    : false, // false en lugar de undefined para desactivar SSL explícitamente si no es Supabase
}

// Crear pool con manejo de errores mejorado
const pool = new Pool(poolConfig)

// Manejar errores del pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err)
})

const adapter = new PrismaPg(pool)

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
