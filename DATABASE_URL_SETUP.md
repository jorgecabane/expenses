# Configuración de DATABASE_URL para Desarrollo y Producción

## Variables Disponibles de Supabase

### Para Desarrollo Local (Direct Connection)
```
POSTGRES_URL_NON_POOLING="postgres://postgres.[PROJECT_REF]:[PASSWORD]@aws-1-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=require"
```
- **Puerto**: 5432 (direct connection)
- **Ventaja**: Más simple, menos problemas con SSL en desarrollo
- **Uso**: Desarrollo local

### Para Producción (Connection Pooling)
```
POSTGRES_PRISMA_URL="postgres://postgres.[PROJECT_REF]:[PASSWORD]@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
```
- **Puerto**: 6543 (pooler)
- **Ventaja**: Mejor rendimiento, maneja más conexiones
- **Uso**: Producción (Vercel)

## Configuración

### Desarrollo Local (.env.local)

```bash
# Usar connection directa para desarrollo
DATABASE_URL="postgres://postgres.[PROJECT_REF]:[PASSWORD]@aws-1-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=require"

# O simplemente usar la variable que ya tienes
# DATABASE_URL=$POSTGRES_URL_NON_POOLING
```

### Producción (Vercel)

En Vercel Dashboard → Settings → Environment Variables:

```bash
# Usar pooler para producción
DATABASE_URL="postgres://postgres.[PROJECT_REF]:[PASSWORD]@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"

# O mapear desde POSTGRES_PRISMA_URL
```

## Código Actualizado

El código en `lib/prisma.ts` ahora:
- Usa `POSTGRES_URL_NON_POOLING` automáticamente en desarrollo
- Usa `POSTGRES_PRISMA_URL` en producción
- O usa `DATABASE_URL` si está configurado

## Recomendación

1. **Desarrollo**: Actualiza tu `.env.local`:
   ```bash
   DATABASE_URL="postgres://postgres.[PROJECT_REF]:[PASSWORD]@aws-1-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=require"
   ```
   - Obtén el valor real desde Supabase Dashboard → Settings → Database → Connection string

2. **Producción**: En Vercel, configura:
   ```bash
   DATABASE_URL="postgres://postgres.[PROJECT_REF]:[PASSWORD]@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
   ```
   - Obtén el valor real desde Supabase Dashboard → Settings → Database → Connection Pooling

## Nota sobre SSL

Todas las connection strings de Supabase requieren SSL (`sslmode=require`). El código ya está configurado para manejar esto con `rejectUnauthorized: false` y `NODE_TLS_REJECT_UNAUTHORIZED=0` en desarrollo.
