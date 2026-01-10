# Troubleshooting: Circuit Breaker Open

## Problema Actual
Error: `Circuit breaker open: Unable to establish connection to upstream database`

Esto significa que después de múltiples intentos fallidos, el pool de conexiones ha bloqueado nuevos intentos.

## Posibles Causas

1. **Contraseña incorrecta** - La contraseña que resetaste puede no estar correctamente copiada
2. **Formato de usuario incorrecto** - Para el pooler, el usuario debe ser `postgres.[PROJECT_REF]`
3. **IP bloqueada** - Supabase puede haber bloqueado tu IP por múltiples intentos fallidos
4. **Formato de connection string incorrecto**

## Soluciones a Probar

### 1. Verificar Network Bans en Supabase

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Database** → **Settings** → **Network Bans**
4. Si tu IP está en la lista, **elimínala**
5. Espera 1-2 minutos antes de intentar de nuevo

### 2. Verificar el Formato de la Connection String

Para **Transaction Pooler** (puerto 6543):
```bash
DATABASE_URL="postgresql://postgres.ljarrjjgajktymlbbumv:[PASSWORD]@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
```

**Importante**: 
- Usuario: `postgres.ljarrjjgajktymlbbumv` (con el project ref)
- Puerto: `6543`
- Host: `aws-1-sa-east-1.pooler.supabase.com`
- Parámetros: `?sslmode=require&pgbouncer=true`

### 3. Probar con Session Pooler (Alternativa)

Si el transaction pooler no funciona, prueba con el **Session Pooler** (puerto 5432):

```bash
DATABASE_URL="postgresql://postgres.ljarrjjgajktymlbbumv:[PASSWORD]@aws-1-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=require&pgbouncer=true"
```

### 4. Verificar la Contraseña

1. Ve a Supabase Dashboard → **Settings** → **Database**
2. Haz click en **Reset Database Password** (si es necesario)
3. Copia la nueva contraseña **exactamente** (sin espacios)
4. Si tiene caracteres especiales, asegúrate de hacer URL encoding:
   - `@` → `%40`
   - `#` → `%23`
   - `%` → `%25`
   - `&` → `%26`

### 5. Reiniciar el Servidor

Después de hacer cambios:
1. **Detén completamente el servidor** (Ctrl+C)
2. Espera 10-15 segundos
3. Reinicia: `npm run dev`

## Verificación Rápida

Para verificar que la connection string es correcta, puedes probar con `psql`:

```bash
psql "postgresql://postgres.ljarrjjgajktymlbbumv:[PASSWORD]@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require"
```

Si `psql` funciona, el problema está en la configuración de Node.js/Prisma.
Si `psql` no funciona, el problema está en la connection string o las credenciales.
