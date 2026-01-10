# Fix: Error SSL con Supabase y Prisma 7

## Problema

Error: `self-signed certificate in certificate chain` al conectar a Supabase con Prisma 7.

## Solución

Tu `DATABASE_URL` actual usa el **pooler de Supabase**:
```
postgres://postgres.ljarrjjgajktymlbbumv:...@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
```

### Opción 1: Usar Connection String Directa (Recomendada para desarrollo)

1. Ve a **Supabase Dashboard** → **Settings** → **Database**
2. En **Connection string**, selecciona **URI** (NO "Connection Pooling")
3. Copia la connection string (será algo como):
   ```
   postgresql://postgres.ljarrjjgajktymlbbumv:[PASSWORD]@aws-1-sa-east-1.connect.supabase.com:5432/postgres
   ```
4. Reemplaza `DATABASE_URL` en tu `.env.local` con esta nueva connection string
5. Agrega `?sslmode=require` al final si no lo tiene

### Opción 2: Mantener Pooler pero verificar configuración

Si quieres seguir usando el pooler, asegúrate de que:

1. Tu `.env.local` tenga:
   ```bash
   NODE_TLS_REJECT_UNAUTHORIZED=0
   DATABASE_URL="postgres://postgres.ljarrjjgajktymlbbumv:...@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
   ```

2. Reinicia el servidor completamente:
   ```bash
   # Detén el servidor (Ctrl+C)
   # Luego reinicia
   npm run dev
   ```

## Verificación

Después de cambiar la connection string:

1. Reinicia el servidor
2. Abre `http://localhost:3000`
3. Debería conectarse sin errores SSL

## Nota sobre Pooler vs Direct Connection

- **Pooler** (puerto 6543): Mejor para producción, pero puede tener problemas con SSL en desarrollo
- **Direct Connection** (puerto 5432): Más simple, funciona mejor en desarrollo local

Para desarrollo, recomiendo usar la **direct connection**. Para producción en Vercel, puedes usar el pooler.
