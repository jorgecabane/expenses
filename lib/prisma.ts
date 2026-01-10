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
const poolConfig: any = {
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  // Para Supabase pooler, necesitamos SSL pero con rejectUnauthorized: false
  ssl: (connectionString.includes('supabase.co') || connectionString.includes('supabase'))
    ? {
        rejectUnauthorized: false,
        // Permitir certificados auto-firmados de Supabase
      }
    : undefined,
}

const pool = new Pool(poolConfig)

const adapter = new PrismaPg(pool)

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
