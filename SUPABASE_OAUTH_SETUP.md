# Configuración de OAuth (Google) en Supabase

El error `"Unsupported provider: provider is not enabled"` significa que necesitas habilitar Google OAuth en tu proyecto de Supabase.

## Paso 1: Habilitar Google OAuth en Supabase

1. **Ve a tu proyecto en Supabase Dashboard:**
   - [https://app.supabase.com](https://app.supabase.com)
   - Selecciona tu proyecto

2. **Navega a Authentication → Providers:**
   - En el menú lateral, ve a **Authentication**
   - Click en **Providers**

3. **Habilita Google:**
   - Busca **Google** en la lista de proveedores
   - Toggle el switch para **habilitarlo**
   - Se abrirá un formulario de configuración

## Paso 2: Configurar Google OAuth

Necesitas crear credenciales OAuth en Google Cloud Console:

### 2.1 Crear proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Navega a **APIs & Services** → **Credentials**

### 2.2 Crear OAuth 2.0 Client ID

1. Click en **Create Credentials** → **OAuth client ID**
2. Si es la primera vez, configura la **OAuth consent screen**:
   - **User Type**: External (para desarrollo) o Internal (si tienes Google Workspace)
   - **App name**: Bolsillos (o el nombre que prefieras)
   - **User support email**: Tu email
   - **Developer contact**: Tu email
   - Click **Save and Continue**
   - En **Scopes**: Click **Save and Continue** (los scopes por defecto están bien)
   - En **Test users**: Agrega tu email si es necesario, luego **Save and Continue**

3. **Crear OAuth Client ID:**
   - **Application type**: Web application
   - **Name**: Bolsillos (o el nombre que prefieras)
   - **Authorized JavaScript origins**:
     - Para desarrollo local: `http://localhost:3000`
     - Para producción: `https://tu-app.vercel.app`
   - **Authorized redirect URIs**:
     - Para desarrollo local: `http://localhost:3000/auth/callback`
     - Para producción: `https://tu-app.vercel.app/auth/callback`
     - **IMPORTANTE**: También agrega la URL de Supabase:
       - `https://[TU-PROJECT-REF].supabase.co/auth/v1/callback`
       - Reemplaza `[TU-PROJECT-REF]` con el ID de tu proyecto Supabase
       - Lo encuentras en Supabase Dashboard → Settings → API → Project URL
       - Ejemplo: Si tu URL es `https://abcdefghijklmnop.supabase.co`, entonces:
         - `https://abcdefghijklmnop.supabase.co/auth/v1/callback`

4. Click **Create**
5. **Copia las credenciales:**
   - **Client ID**: Lo necesitarás
   - **Client Secret**: Lo necesitarás

### 2.3 Configurar en Supabase

1. **Vuelve a Supabase Dashboard** → **Authentication** → **Providers** → **Google**

2. **Completa el formulario:**
   - **Client ID (for OAuth)**: Pega el Client ID de Google
   - **Client Secret (for OAuth)**: Pega el Client Secret de Google

3. **Click en Save**

## Paso 3: Verificar la configuración

### URLs de callback importantes

Asegúrate de tener estas URLs en Google Cloud Console:

**Para desarrollo:**
- `http://localhost:3000/auth/callback`
- `https://[TU-PROJECT-REF].supabase.co/auth/v1/callback`

**Para producción:**
- `https://tu-app.vercel.app/auth/callback`
- `https://[TU-PROJECT-REF].supabase.co/auth/v1/callback`

### Probar OAuth

1. **En desarrollo local:**
   - Asegúrate de tener `NEXT_PUBLIC_APP_URL=http://localhost:3000` en tu `.env.local`
   - Ejecuta `npm run dev`
   - Intenta iniciar sesión con Google

2. **En producción:**
   - Verifica que `NEXT_PUBLIC_APP_URL` en Vercel tenga la URL correcta
   - Intenta iniciar sesión con Google

## Troubleshooting

### Error: "redirect_uri_mismatch"

- Verifica que todas las URLs de callback estén agregadas en Google Cloud Console
- Asegúrate de incluir la URL de Supabase: `https://[PROJECT-REF].supabase.co/auth/v1/callback`

### Error: "access_denied"

- Verifica que el OAuth consent screen esté configurado correctamente
- Si estás en modo "Testing", asegúrate de agregar tu email como test user

### Error: "invalid_client"

- Verifica que el Client ID y Client Secret sean correctos
- Asegúrate de haberlos copiado sin espacios adicionales

### El botón de Google no funciona

- Verifica que Google esté habilitado en Supabase (toggle activado)
- Revisa la consola del navegador para ver errores
- Verifica que `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` estén correctas

## Notas importantes

1. **URLs de callback**: Supabase maneja la autenticación, así que la URL de callback de Supabase (`https://[PROJECT-REF].supabase.co/auth/v1/callback`) es la más importante.

2. **Múltiples entornos**: Si tienes desarrollo y producción, agrega todas las URLs necesarias en Google Cloud Console.

3. **Cambios en producción**: Si cambias la URL de producción en Vercel, actualiza también las URLs autorizadas en Google Cloud Console.

## Referencias

- [Supabase OAuth Docs](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google Cloud Console](https://console.cloud.google.com/)
- [OAuth 2.0 Setup Guide](https://developers.google.com/identity/protocols/oauth2)
