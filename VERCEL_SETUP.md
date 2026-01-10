# Configuración de Vercel con Supabase

Esta guía te ayudará a conectar tu proyecto de Supabase con Vercel para obtener automáticamente las variables de entorno.

## Opción 1: Integración Automática (Recomendada)

### Paso 1: Conectar Supabase desde Vercel

1. **En Vercel Dashboard:**
   - Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
   - Navega a **Settings** → **Integrations**
   - Busca **Supabase** en la lista de integraciones disponibles
   - Haz click en **Add Integration**

2. **Seleccionar Proyecto de Supabase:**
   - Si no tienes una cuenta de Supabase conectada, Vercel te pedirá autenticarte
   - Selecciona el proyecto de Supabase que quieres conectar
   - Vercel automáticamente detectará y agregará **muchas variables** de Supabase (ver sección "Variables Automáticas" abajo)

3. **Mapear DATABASE_URL (IMPORTANTE):**
   - Vercel agregó `POSTGRES_PRISMA_URL` automáticamente
   - Necesitas crear `DATABASE_URL` con el mismo valor:
     - Ve a **Settings** → **Environment Variables**
     - Busca `POSTGRES_PRISMA_URL` y copia su valor
     - Crea una nueva variable:
       - **Name**: `DATABASE_URL`
       - **Value**: Pega el valor de `POSTGRES_PRISMA_URL`
       - **Environments**: Production, Preview (y Development si quieres)

4. **Configurar Variables Adicionales:**
   - Agrega las variables que faltan:
     - `RESEND_API_KEY`: Tu API key de Resend
     - `NEXT_PUBLIC_APP_URL`: URL de tu app en producción (ej: `https://tu-app.vercel.app`)
       - Puedes agregarla después de tu primer deploy

📖 **Guía detallada de todas las variables**: Ver [VARIABLES_GUIDE.md](./VARIABLES_GUIDE.md)

### Paso 2: Configurar Variables por Entorno

Vercel permite configurar variables diferentes para:
- **Production**: Variables para producción
- **Preview**: Variables para preview deployments
- **Development**: Variables para desarrollo local

**Recomendación:**
- `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Todas las entornos (Production, Preview, Development)
- `DATABASE_URL`: Production y Preview (no Development, usa tu .env.local)
- `RESEND_API_KEY`: Production y Preview
- `NEXT_PUBLIC_APP_URL`: Production y Preview con sus respectivas URLs

## Opción 2: Configuración Manual

Si prefieres configurar manualmente o la integración no está disponible:

### Paso 1: Obtener Variables de Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **Settings** → **API**
3. Copia los siguientes valores:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** (opcional) → `SUPABASE_SERVICE_ROLE_KEY`

4. Para `DATABASE_URL`:
   - Ve a **Settings** → **Database**
   - En **Connection string**, selecciona **URI**
   - Copia la connection string (formato: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`)

### Paso 2: Agregar Variables en Vercel

1. En Vercel Dashboard, ve a tu proyecto
2. **Settings** → **Environment Variables**
3. Agrega cada variable:
   - **Name**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: Tu Project URL de Supabase
   - **Environments**: Selecciona Production, Preview, Development según corresponda
   - Click **Save**

4. Repite para todas las variables necesarias

## Variables Requeridas

### Supabase (Automáticas con integración)
- `NEXT_PUBLIC_SUPABASE_URL` ✅ (automática)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅ (automática)
- `DATABASE_URL` ⚠️ (mapear desde `POSTGRES_PRISMA_URL`)

### Otras (Manuales)
- `RESEND_API_KEY` ⚠️ (agregar manualmente)
- `NEXT_PUBLIC_APP_URL` ⚠️ (agregar manualmente después del primer deploy)

## Variables Automáticas de Supabase

Cuando conectas Supabase con Vercel, se agregan automáticamente muchas variables. **Solo necesitas algunas**:

### ✅ Variables que SÍ usamos:
- `NEXT_PUBLIC_SUPABASE_URL` - URL del proyecto
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Clave pública para autenticación
- `POSTGRES_PRISMA_URL` - Connection string para Prisma (mapear a `DATABASE_URL`)

### ❌ Variables que NO necesitas (pero puedes dejarlas):
- `POSTGRES_DATABASE`, `POSTGRES_HOST`, `POSTGRES_PASSWORD`, `POSTGRES_USER`
- `POSTGRES_URL`, `POSTGRES_URL_NON_POOLING`
- `SUPABASE_ANON_KEY`, `SUPABASE_JWT_SECRET`, `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

**Nota**: Estas variables no hacen daño si las dejas, pero no las usamos en nuestro código.

📖 **Ver guía completa**: [VARIABLES_GUIDE.md](./VARIABLES_GUIDE.md) para detalles de cada variable.

## Verificación

Después de configurar:

1. **Haz un nuevo deployment:**
   ```bash
   git push origin main
   ```

2. **Verifica en los logs de Vercel:**
   - Ve a tu deployment en Vercel
   - Click en **Logs**
   - Verifica que no haya errores relacionados con variables de entorno faltantes

3. **Prueba la aplicación:**
   - Visita tu URL de Vercel
   - Intenta registrarte o iniciar sesión
   - Verifica que la conexión con Supabase funcione

## Troubleshooting

### Error: "Missing environment variable"

- Verifica que todas las variables estén configuradas en Vercel
- Asegúrate de que las variables `NEXT_PUBLIC_*` estén disponibles en todos los entornos
- Revisa que los nombres de las variables coincidan exactamente (case-sensitive)

### Error de conexión a Supabase

- Verifica que `NEXT_PUBLIC_SUPABASE_URL` sea correcta
- Verifica que `NEXT_PUBLIC_SUPABASE_ANON_KEY` sea la clave anon (no service_role)
- Revisa que el proyecto de Supabase esté activo

### Error de conexión a la base de datos

- Verifica que `DATABASE_URL` tenga el formato correcto
- Asegúrate de que la contraseña en la URL esté URL-encoded
- Verifica que el pooler de Supabase esté habilitado si usas connection pooling

## Configuración de Connection Pooling (Opcional pero Recomendado)

Para mejor rendimiento en producción, usa el connection pooler de Supabase:

1. En Supabase Dashboard → **Settings** → **Database**
2. En **Connection string**, selecciona **Connection Pooling**
3. Copia la URL (tiene el formato: `postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`)
4. Úsala como `DATABASE_URL` en Vercel

## Script de Verificación

Puedes crear un script para verificar que todas las variables estén configuradas:

```bash
# verificar-env.sh
#!/bin/bash

required_vars=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "DATABASE_URL"
  "RESEND_API_KEY"
  "NEXT_PUBLIC_APP_URL"
)

missing_vars=()

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    missing_vars+=("$var")
  fi
done

if [ ${#missing_vars[@]} -eq 0 ]; then
  echo "✅ Todas las variables de entorno están configuradas"
else
  echo "❌ Faltan las siguientes variables:"
  printf '%s\n' "${missing_vars[@]}"
  exit 1
fi
```

## Referencias

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase Integration with Vercel](https://supabase.com/docs/guides/integrations/vercel)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
