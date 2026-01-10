# Guía de Variables de Entorno - Vercel + Supabase

## ✅ Variables que SÍ necesitas (y qué hacer con ellas)

### Ya configuradas automáticamente por Vercel/Supabase:

1. **`NEXT_PUBLIC_SUPABASE_URL`** ✅
   - **Usar**: SÍ, déjala como está
   - **Uso**: Conexión al proyecto de Supabase desde el cliente

2. **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** ✅
   - **Usar**: SÍ, déjala como está
   - **Uso**: Clave pública para autenticación desde el cliente

### Necesitas mapear/crear:

3. **`DATABASE_URL`** ⚠️ **IMPORTANTE**
   - **Opción A (Recomendada)**: Usa `POSTGRES_PRISMA_URL` que ya tienes
     - En Vercel, ve a **Settings** → **Environment Variables**
     - Crea una nueva variable llamada `DATABASE_URL`
     - Como valor, copia el valor de `POSTGRES_PRISMA_URL`
     - O simplemente renombra `POSTGRES_PRISMA_URL` a `DATABASE_URL` (pero mejor crear una nueva)
   
   - **Opción B**: Usa `POSTGRES_URL` (con connection pooling)
   
   - **Opción C**: Usa `POSTGRES_URL_NON_POOLING` (sin pooling, menos eficiente)

   **Recomendación**: Usa `POSTGRES_PRISMA_URL` → mapea a `DATABASE_URL`

### Variables adicionales que debes agregar manualmente:

4. **`RESEND_API_KEY`**
   - Agrega esta variable manualmente con tu API key de Resend

5. **`NEXT_PUBLIC_APP_URL`**
   - Agrega esta variable con la URL de tu app en Vercel
   - Ejemplo: `https://tu-proyecto.vercel.app`

## ❌ Variables que NO necesitas (pero puedes dejarlas)

Estas variables fueron agregadas automáticamente pero **no las usamos en nuestro código**. Puedes dejarlas ahí (no hacen daño) o eliminarlas si quieres limpiar:

- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (duplicado de ANON_KEY)
- `POSTGRES_DATABASE` (no la usamos directamente)
- `POSTGRES_HOST` (no la usamos directamente)
- `POSTGRES_PASSWORD` (no la usamos directamente)
- `POSTGRES_USER` (no la usamos directamente)
- `POSTGRES_URL` (ya tienes POSTGRES_PRISMA_URL que es mejor)
- `POSTGRES_URL_NON_POOLING` (menos eficiente que PRISMA_URL)
- `SUPABASE_ANON_KEY` (duplicado, ya tienes NEXT_PUBLIC_SUPABASE_ANON_KEY)
- `SUPABASE_JWT_SECRET` (no la usamos)
- `SUPABASE_PUBLISHABLE_KEY` (duplicado)
- `SUPABASE_SECRET_KEY` (no la usamos)
- `SUPABASE_SERVICE_ROLE_KEY` (útil para operaciones admin, pero no necesaria para MVP)
- `SUPABASE_URL` (duplicado, ya tienes NEXT_PUBLIC_SUPABASE_URL)

## 📋 Resumen: Qué hacer ahora

### Paso 1: Mapear DATABASE_URL

En Vercel Dashboard → **Settings** → **Environment Variables**:

1. Busca la variable `POSTGRES_PRISMA_URL`
2. Copia su valor
3. Crea una nueva variable:
   - **Name**: `DATABASE_URL`
   - **Value**: Pega el valor de `POSTGRES_PRISMA_URL`
   - **Environments**: Selecciona Production, Preview (y Development si quieres)

### Paso 2: Agregar variables faltantes

Agrega estas dos variables manualmente:

1. **`RESEND_API_KEY`**
   - Obtén tu API key desde [Resend Dashboard](https://resend.com/api-keys)
   - Agrega en Vercel con valor de tu API key

2. **`NEXT_PUBLIC_APP_URL`**
   - Después de tu primer deploy, copia la URL de Vercel
   - Ejemplo: `https://bolsillos.vercel.app`
   - Agrega en Vercel

### Paso 3: Verificar

Después de configurar, haz un nuevo deployment y verifica que todo funcione.

## 🔍 Cómo verificar que todo está bien

1. **En Vercel Dashboard:**
   - Ve a tu proyecto → **Settings** → **Environment Variables**
   - Deberías ver al menos estas variables:
     - ✅ `NEXT_PUBLIC_SUPABASE_URL`
     - ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - ✅ `DATABASE_URL` (mapeada desde POSTGRES_PRISMA_URL)
     - ✅ `RESEND_API_KEY`
     - ✅ `NEXT_PUBLIC_APP_URL`

2. **En los logs del deployment:**
   - Si hay errores de variables faltantes, aparecerán en los logs
   - Revisa que no haya errores relacionados con `DATABASE_URL`

## 💡 Nota sobre las variables duplicadas

Vercel/Supabase agregó algunas variables duplicadas (como `SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_URL`). Esto es normal. Nosotros usamos las versiones con `NEXT_PUBLIC_` porque son las que Next.js expone al cliente. Las otras puedes dejarlas o eliminarlas, no afectan.

## 🎯 Variables finales necesarias

Para que la app funcione, necesitas estas 5 variables:

1. `NEXT_PUBLIC_SUPABASE_URL` ✅ (automática)
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅ (automática)
3. `DATABASE_URL` ⚠️ (mapear desde POSTGRES_PRISMA_URL)
4. `RESEND_API_KEY` ⚠️ (agregar manualmente)
5. `NEXT_PUBLIC_APP_URL` ⚠️ (agregar manualmente después del primer deploy)
