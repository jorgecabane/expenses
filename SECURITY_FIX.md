# ⚠️ IMPORTANTE: Credenciales Expuestas en Git

## Acción Inmediata Requerida

Se detectaron credenciales de PostgreSQL expuestas en el historial de Git. **DEBES tomar acción inmediata**.

## Pasos a Seguir

### 1. Cambiar Credenciales en Supabase (URGENTE)

1. Ve a [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecciona tu proyecto
3. Ve a **Settings** → **Database**
4. Haz click en **Reset Database Password**
5. Genera una nueva contraseña
6. Actualiza todas tus variables de entorno:
   - `.env.local` (desarrollo)
   - Vercel Environment Variables (producción)
   - Cualquier otro lugar donde uses estas credenciales

### 2. Limpiar Historial de Git

Las credenciales ya fueron eliminadas de los archivos actuales, pero **siguen en el historial de Git**. Debes limpiarlas:

#### Opción A: Usando git filter-repo (Recomendado)

```bash
# Instalar git-filter-repo si no lo tienes
# macOS: brew install git-filter-repo
# O: pip install git-filter-repo

# Eliminar archivos del historial
git filter-repo --path DATABASE_URL_SETUP.md --invert-paths
git filter-repo --path PRISMA_SSL_FIX.md --invert-paths

# O eliminar solo las líneas con credenciales
git filter-repo --path DATABASE_URL_SETUP.md --replace-text <(echo 'YoV1ksPOb4A5yzKj==>[PASSWORD]')
git filter-repo --path PRISMA_SSL_FIX.md --replace-text <(echo 'YoV1ksPOb4A5yzKj==>[PASSWORD]')
```

#### Opción B: Usando BFG Repo-Cleaner

```bash
# Descargar BFG: https://rtyley.github.io/bfg-repo-cleaner/

# Crear archivo con credenciales a eliminar
echo 'YoV1ksPOb4A5yzKj' > passwords.txt

# Limpiar historial
java -jar bfg.jar --replace-text passwords.txt

# Limpiar referencias
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

#### Opción C: Forzar push (si es un repo privado y solo tú trabajas)

```bash
# ⚠️ SOLO si es un repo privado y solo tú trabajas
# Esto reescribe el historial completamente

git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch DATABASE_URL_SETUP.md PRISMA_SSL_FIX.md" \
  --prune-empty --tag-name-filter cat -- --all

git push origin --force --all
git push origin --force --tags
```

### 3. Verificar que las Credenciales Fueron Eliminadas

```bash
# Buscar en el historial
git log --all --full-history --source -- DATABASE_URL_SETUP.md
git log --all --full-history --source -- PRISMA_SSL_FIX.md

# Buscar strings específicos
git log -p --all -S "YoV1ksPOb4A5yzKj"
git log -p --all -S "ljarrjjgajktymlbbumv"
```

### 4. Actualizar Variables de Entorno

Después de cambiar las credenciales en Supabase, actualiza:

- `.env.local` (local)
- Vercel Environment Variables (producción)
- Cualquier otro servicio que use estas credenciales

### 5. Monitoreo

- Revisa GitGuardian para confirmar que el problema se resolvió
- Considera usar [GitGuardian](https://www.gitguardian.com/) o [TruffleHog](https://github.com/trufflesecurity/trufflehog) para prevenir futuros leaks

## Archivos Modificados

Los siguientes archivos fueron limpiados (credenciales reemplazadas con placeholders):
- `DATABASE_URL_SETUP.md` - Passwords eliminados
- `PRISMA_SSL_FIX.md` - Passwords eliminados  
- `GOOGLE_OAUTH_QUICK_SETUP.md` - PROJECT_REF eliminado

## Script de Limpieza

Se creó un script en `scripts/clean-git-history.sh` que puedes ejecutar para limpiar el historial automáticamente:

```bash
./scripts/clean-git-history.sh
```

⚠️ **Lee el script antes de ejecutarlo** y asegúrate de haber cambiado las credenciales primero.

## Nota

Si este es un repositorio público o compartido, **debes asumir que las credenciales están comprometidas** y cambiarlas inmediatamente, incluso si limpias el historial de Git.
