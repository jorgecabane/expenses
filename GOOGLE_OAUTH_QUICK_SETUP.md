# Setup Rápido: Google OAuth

## Tu Callback URL de Supabase

```
https://[PROJECT_REF].supabase.co/auth/v1/callback
```

**IMPORTANTE**: Esta URL debe agregarse en Google Cloud Console.

## Pasos en Google Cloud Console

### 1. Ir a Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto (o crea uno nuevo)

### 2. Configurar OAuth Consent Screen (si es primera vez)

1. Ve a **APIs & Services** → **OAuth consent screen**
2. Completa:
   - **User Type**: External (para desarrollo)
   - **App name**: Bolsillos
   - **User support email**: Tu email
   - **Developer contact**: Tu email
3. Click **Save and Continue** en cada paso
4. En **Test users**: Agrega tu email si es necesario

### 3. Crear OAuth Client ID

1. Ve a **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Si te pide configurar consent screen, hazlo primero (paso 2)

4. **Completa el formulario:**
   - **Application type**: Web application
   - **Name**: Bolsillos (o el que prefieras)

5. **Authorized JavaScript origins:**
   - Para desarrollo: `http://localhost:3000`
   - Para producción: `https://tu-app.vercel.app` (agrega después del deploy)

6. **Authorized redirect URIs** (MUY IMPORTANTE):
   - ✅ **AGREGA ESTA URL** (copia exactamente):
     ```
     https://[PROJECT_REF].supabase.co/auth/v1/callback
     ```
   - Para desarrollo local (opcional):
     ```
     http://localhost:3000/auth/callback
     ```
   - Para producción (agrega después del deploy):
     ```
     https://tu-app.vercel.app/auth/callback
     ```

7. Click **Create**

8. **Copia las credenciales:**
   - **Client ID**: Lo necesitarás
   - **Client Secret**: Lo necesitarás

### 4. Volver a Supabase

1. En Supabase → **Authentication** → **Providers** → **Google**
2. Pega las credenciales:
   - **Client ID (for OAuth)**: Pega el Client ID de Google
   - **Client Secret (for OAuth)**: Pega el Client Secret de Google
3. **Switches**: Déjalos desactivados (a menos que necesites "Allow users without an email")
4. Click **Save**

## Verificación

Después de configurar:

1. **En Supabase**: Verifica que Google esté habilitado (toggle activado)
2. **Prueba**: Intenta iniciar sesión con Google en tu app
3. **Si hay error**: Revisa que la URL de callback esté exactamente como se muestra arriba

## Troubleshooting

### Error: "redirect_uri_mismatch"

- Verifica que la URL de callback en Google Cloud Console sea **exactamente**:
  ```
  https://[PROJECT_REF].supabase.co/auth/v1/callback
  ```
- No debe tener espacios, trailing slashes adicionales, etc.

### Error: "access_denied"

- Verifica que el OAuth consent screen esté configurado
- Si estás en modo "Testing", agrega tu email como test user

## Resumen de URLs importantes

**Callback URL de Supabase (OBLIGATORIA en Google Cloud):**
```
https://[PROJECT_REF].supabase.co/auth/v1/callback
```

**URLs adicionales para desarrollo/producción (opcionales pero recomendadas):**
- Desarrollo: `http://localhost:3000/auth/callback`
- Producción: `https://tu-app.vercel.app/auth/callback`
