# Troubleshooting: Error RESEND_API_KEY en Vercel

## Problema

Error durante el deploy en Vercel:
```
Error: RESEND_API_KEY is not set
```

## Soluciones

### 1. Verificar que la variable esté configurada correctamente

1. Ve a **Vercel Dashboard** → Tu proyecto → **Settings** → **Environment Variables**
2. Busca `RESEND_API_KEY` en la lista
3. Verifica que:
   - ✅ El nombre sea exactamente `RESEND_API_KEY` (sin espacios, mayúsculas correctas)
   - ✅ El valor esté completo (empieza con `re_`)
   - ✅ Esté habilitada para el entorno correcto:
     - **Production**: Si estás haciendo deploy a producción
     - **Preview**: Si estás haciendo deploy de un PR/branch
     - **Development**: Si estás usando Vercel CLI localmente

### 2. Verificar el entorno del deploy

En Vercel, cada deploy puede ser para diferentes entornos:
- **Production**: Deploy desde la rama principal (main/master)
- **Preview**: Deploy desde PRs o otras ramas
- **Development**: Deploy local con Vercel CLI

**Solución**: Asegúrate de que `RESEND_API_KEY` esté habilitada para el entorno que estás usando.

### 3. Re-agregar la variable

A veces las variables se corrompen o no se aplican correctamente:

1. Ve a **Settings** → **Environment Variables**
2. Busca `RESEND_API_KEY`
3. Haz click en los **3 puntos** → **Edit**
4. Verifica el valor
5. Asegúrate de que los checkboxes de **Production**, **Preview** y **Development** estén marcados según necesites
6. Guarda los cambios
7. **Haz un nuevo deploy** (no basta con redeploy, necesitas un nuevo commit o forzar redeploy)

### 4. Verificar que el valor sea correcto

El valor de `RESEND_API_KEY` debe:
- Empezar con `re_`
- Tener al menos 32 caracteres
- No tener espacios al inicio o final
- Estar completo (copiado correctamente desde Resend Dashboard)

**Cómo obtener el valor correcto:**
1. Ve a [Resend Dashboard](https://resend.com/api-keys)
2. Si no tienes una API key, crea una nueva
3. Copia el valor completo (empieza con `re_`)
4. Pégala en Vercel sin espacios adicionales

### 5. Forzar un nuevo deploy

Después de cambiar las variables de entorno:

1. Ve a **Deployments**
2. Haz click en los **3 puntos** del último deploy
3. Selecciona **Redeploy**
4. O mejor aún, haz un commit nuevo (puede ser un cambio menor) para forzar un nuevo build

### 6. Verificar en los logs

1. Ve a **Deployments** → Selecciona el deploy que falló
2. Revisa los **Build Logs**
3. Busca si hay algún mensaje sobre variables de entorno
4. Verifica que el build esté usando el entorno correcto

## Verificación Rápida

Ejecuta este comando para verificar que la variable esté configurada:

```bash
# En Vercel CLI (si lo tienes instalado)
vercel env ls
```

O verifica manualmente en el dashboard:
- **Settings** → **Environment Variables** → Busca `RESEND_API_KEY`

## Código Actualizado

El código ahora maneja mejor la ausencia de la variable durante el build, pero **aún necesitas configurarla en Vercel** para que funcione en runtime.

La validación ahora es "lazy" (solo cuando se usa), lo que permite que el build pase, pero fallará en runtime si la variable no está configurada.

## Checklist Final

- [ ] `RESEND_API_KEY` existe en Vercel Dashboard
- [ ] El nombre es exactamente `RESEND_API_KEY` (sin typos)
- [ ] El valor empieza con `re_` y está completo
- [ ] Está habilitada para el entorno correcto (Production/Preview)
- [ ] Se hizo un nuevo deploy después de configurar/actualizar la variable
- [ ] Los logs del deploy muestran que la variable está disponible

## Si el problema persiste

1. **Elimina y vuelve a crear la variable** en Vercel
2. **Verifica que no haya espacios** en el nombre o valor
3. **Usa Vercel CLI** para verificar: `vercel env pull` y revisa el `.env.local` generado
4. **Contacta a Vercel Support** si nada funciona (puede ser un bug de su plataforma)
