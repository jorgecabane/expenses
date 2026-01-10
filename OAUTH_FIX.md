# Fix: OAuth redirige a /login en lugar de /auth/callback

## Problema

Después de autenticar con Google, Supabase redirige a `/login?code=...` en lugar de `/auth/callback`.

## Solución Implementada

He actualizado el código para manejar este caso:

1. **Middleware actualizado**: Ahora permite `/auth/callback` como ruta pública
2. **LoginForm actualizado**: Detecta si hay un `code` en la URL y redirige automáticamente a `/auth/callback`
3. **LoginPage actualizado**: También detecta el código y redirige al callback

## Verificación en Supabase

El problema puede ser que Supabase tiene una URL de redirect configurada incorrectamente. Verifica:

1. **En Supabase Dashboard:**
   - Ve a **Authentication** → **URL Configuration**
   - Verifica que **Site URL** sea: `http://localhost:3000` (para desarrollo)
   - Verifica que **Redirect URLs** incluya:
     - `http://localhost:3000/auth/callback`
     - `http://localhost:3000/**` (wildcard para desarrollo)

2. **Para producción:**
   - **Site URL**: `https://tu-app.vercel.app`
   - **Redirect URLs**:
     - `https://tu-app.vercel.app/auth/callback`
     - `https://tu-app.vercel.app/**`

## Cómo probar

1. **Reinicia el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

2. **Intenta iniciar sesión con Google de nuevo**

3. **Si aún redirige a `/login`:**
   - El código ahora debería detectar el `code` en la URL y redirigir automáticamente a `/auth/callback`
   - Deberías ser redirigido al dashboard después

## Si el problema persiste

1. **Verifica en Supabase Dashboard:**
   - **Authentication** → **URL Configuration**
   - Asegúrate de que las URLs de redirect estén configuradas correctamente

2. **Verifica en Google Cloud Console:**
   - Asegúrate de que `http://localhost:3000/auth/callback` esté en **Authorized redirect URIs**

3. **Limpia cookies y caché del navegador**

4. **Revisa la consola del navegador** para ver si hay errores
