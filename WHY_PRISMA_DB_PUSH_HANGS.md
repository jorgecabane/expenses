# Por qué `prisma db push` se queda colgado

## Problema

Cuando ejecutas `npx prisma db push` desde la terminal, el comando se queda colgado y no responde.

## Causas Posibles

### 1. **Transaction Pooler de Supabase**

El **Transaction Pooler** (puerto 6543) que estás usando tiene limitaciones:

- **No soporta transacciones largas**: `prisma db push` necesita ejecutar múltiples comandos SQL en una transacción
- **Timeout corto**: El pooler tiene un timeout de conexión que puede ser más corto que el tiempo que toma `db push`
- **Modo de transacción**: El pooler está optimizado para queries rápidas, no para DDL (Data Definition Language) como `ALTER TABLE`

### 2. **Connection Timeout**

Aunque aumentamos el `connectionTimeoutMillis` a 30 segundos en `lib/prisma.ts`, `prisma db push` usa su propia conexión que puede tener timeouts más cortos.

### 3. **Prisma Client vs Prisma Migrate**

`prisma db push` intenta:
1. Conectarse a la base de datos
2. Leer el schema actual
3. Comparar con tu schema
4. Generar y ejecutar los cambios en una transacción

Este proceso puede tomar más tiempo del que el pooler permite.

## Soluciones

### ✅ Solución 1: Usar Direct Connection (Recomendado para migraciones)

Para ejecutar migraciones, usa la **Direct Connection** (puerto 5432) en lugar del pooler:

```bash
# Temporalmente, cambia DATABASE_URL en .env a:
DATABASE_URL="postgresql://postgres.ljarrjjgajktymlbbumv:[PASSWORD]@db.ljarrjjgajktymlbbumv.supabase.co:5432/postgres?sslmode=require"

# Luego ejecuta:
npx prisma db push

# Después vuelve a cambiar a transaction pooler para desarrollo
```

**Nota**: El problema es que `db.ljarrjjgajktymlbbumv.supabase.co` no se resolvía antes. Si ahora funciona, usa esta opción.

### ✅ Solución 2: Ejecutar SQL Manualmente (Lo que estás haciendo)

1. Ve a Supabase Dashboard → **SQL Editor**
2. Ejecuta el SQL del archivo `migrations/add_recurring_to_incomes.sql`
3. Es más rápido y confiable para cambios pequeños

### ✅ Solución 3: Usar Supabase Migrations

Supabase tiene su propio sistema de migraciones que puedes usar desde el dashboard.

## Recomendación

Para **desarrollo local**:
- Usa **Transaction Pooler** (puerto 6543) para queries normales
- Usa **Direct Connection** (puerto 5432) solo cuando necesites ejecutar migraciones
- O ejecuta SQL manualmente en Supabase Dashboard

Para **producción**:
- Siempre usa migraciones (`prisma migrate`) en lugar de `db push`
- Ejecuta las migraciones desde un entorno que tenga acceso a la direct connection

## Verificar que funcionó

Después de ejecutar el SQL, verifica que las columnas existen:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'incomes' 
AND column_name IN ('is_recurring', 'recurring_config');
```

Deberías ver:
- `is_recurring` | `boolean` | `NO`
- `recurring_config` | `jsonb` | `YES`
