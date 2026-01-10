# Fix Rápido: Connection Timeout después de Reset Password

## Problema
Después de resetear la contraseña de la base de datos, tienes errores de connection timeout.

## Solución Rápida

### 1. Obtener Nueva Connection String de Supabase

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings** → **Database**
4. En **Connection string**, selecciona **URI** (NO "Connection Pooling")
5. Copia la connection string completa (incluye la nueva contraseña)
6. Debería verse así:
   ```
   postgresql://postgres.[PROJECT_REF]:[NUEVA_PASSWORD]@aws-1-sa-east-1.connect.supabase.com:5432/postgres
   ```

### 2. Actualizar `.env.local`

Abre tu archivo `.env.local` y actualiza `DATABASE_URL`:

```bash
# Reemplaza con la nueva connection string que copiaste
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[NUEVA_PASSWORD]@aws-1-sa-east-1.connect.supabase.com:5432/postgres?sslmode=require"
```

**Importante**: 
- Usa el puerto **5432** (direct connection) para desarrollo
- Agrega `?sslmode=require` al final
- Usa el host `connect.supabase.com` (NO `pooler.supabase.com`) para desarrollo

### 3. Verificar Variables Adicionales

Si tienes estas variables, también actualízalas:

```bash
# Si las tienes, actualízalas también
POSTGRES_URL_NON_POOLING="postgresql://postgres.[PROJECT_REF]:[NUEVA_PASSWORD]@aws-1-sa-east-1.connect.supabase.com:5432/postgres?sslmode=require"
```

### 4. Reiniciar Servidor

```bash
# Detén el servidor completamente (Ctrl+C)
# Luego reinicia
npm run dev
```

### 5. Si Sigue Fallando

Aumenta el timeout en `lib/prisma.ts` (ya está configurado en 10 segundos, pero puedes aumentarlo):

```typescript
connectionTimeoutMillis: 30000, // Aumentar a 30 segundos
```

## Para Producción (Vercel)

1. Ve a Vercel Dashboard → Settings → Environment Variables
2. Busca `POSTGRES_PRISMA_URL` (se actualiza automáticamente cuando cambias la password en Supabase)
3. O actualiza `DATABASE_URL` manualmente con la nueva connection string del pooler:
   - En Supabase → Settings → Database → Connection Pooling
   - Copia la URL del pooler (puerto 6543)
   - Actualiza `DATABASE_URL` en Vercel

## Verificación

Después de actualizar:

1. Reinicia el servidor de desarrollo
2. Verifica que no haya errores en la consola
3. Intenta hacer una operación de base de datos (ej: crear un gasto)
