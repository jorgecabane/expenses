# Configuración de Supabase para Desarrollo y Producción

## Problema

Necesitas que Supabase funcione tanto en `localhost:3000` (desarrollo) como en `https://expenses-three-rho.vercel.app` (producción).

## Solución: Configurar Múltiples URLs

### 1. En Supabase Dashboard

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. **Authentication** → **URL Configuration**

3. **Site URL**: 
   - Puedes dejar la de producción: `https://expenses-three-rho.vercel.app`
   - O la de desarrollo: `http://localhost:3000`
   - (Esta es la URL "principal", pero no es crítica si tienes las redirect URLs configuradas)

4. **Redirect URLs** (MUY IMPORTANTE - aquí sí necesitas ambas):
   ```
   http://localhost:3000/auth/callback
   http://localhost:3000/**
   https://expenses-three-rho.vercel.app/auth/callback
   https://expenses-three-rho.vercel.app/**
   ```
   
   **Nota**: Puedes agregar múltiples URLs, una por línea. Supabase aceptará redirects a cualquiera de estas URLs.

5. **Click en Save**

### 2. En Google Cloud Console (si usas Google OAuth)

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services** → **Credentials**
3. Selecciona tu **OAuth 2.0 Client ID**
4. En **Authorized JavaScript origins**, agrega ambas:
   ```
   http://localhost:3000
   https://expenses-three-rho.vercel.app
   ```

5. En **Authorized redirect URIs**, agrega todas estas:
   ```
   http://localhost:3000/auth/callback
   https://expenses-three-rho.vercel.app/auth/callback
   https://[TU-PROJECT-REF].supabase.co/auth/v1/callback
   ```
   (Reemplaza `[TU-PROJECT-REF]` con tu project reference de Supabase)

6. **Click en Save**

## Cómo Funciona

- **En desarrollo** (`localhost:3000`): Supabase redirigirá a `http://localhost:3000/auth/callback`
- **En producción** (`expenses-three-rho.vercel.app`): Supabase redirigirá a `https://expenses-three-rho.vercel.app/auth/callback`

Supabase detecta automáticamente desde qué dominio viene la request y usa la URL correspondiente.

## Verificación

1. **En desarrollo local:**
   - Asegúrate de que `NEXT_PUBLIC_APP_URL` en `.env.local` esté vacía o sea `http://localhost:3000`
   - O simplemente no la uses (el código usará `window.location.origin` en desarrollo)
   - Ejecuta `npm run dev`
   - Intenta iniciar sesión con Google

2. **En producción:**
   - Verifica que `NEXT_PUBLIC_APP_URL` en Vercel sea `https://expenses-three-rho.vercel.app`
   - Intenta iniciar sesión con Google

## Notas Importantes

- **Puedes tener múltiples URLs en Redirect URLs**: Supabase acepta todas las que agregues
- **Site URL es menos crítico**: Si tienes las redirect URLs configuradas, Supabase usará la que corresponda según el origen de la request
- **Google Cloud Console también acepta múltiples URLs**: Puedes agregar todas las que necesites

## Troubleshooting

Si en localhost te redirige a producción:
- Verifica que `http://localhost:3000/auth/callback` esté en las Redirect URLs de Supabase
- Verifica que `http://localhost:3000` esté en Authorized JavaScript origins de Google Cloud
- Limpia cookies del navegador (especialmente las de Supabase)

Si en producción te redirige a localhost:
- Verifica que `https://expenses-three-rho.vercel.app/auth/callback` esté en las Redirect URLs de Supabase
- Verifica que `NEXT_PUBLIC_APP_URL` en Vercel tenga la URL correcta
