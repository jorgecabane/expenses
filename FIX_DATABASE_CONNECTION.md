# Fix: Connection Timeout - Hostname no resuelto

## Problema
Error: `getaddrinfo ENOTFOUND db.ljarrjjgajktymlbbumv.supabase.co`

El hostname de la direct connection no se puede resolver. Esto puede deberse a:
- Problemas de DNS/red
- El formato del hostname ha cambiado en Supabase
- Restricciones de red locales

## Solución: Usar Transaction Pooler

El **Transaction pooler** es más confiable y funciona mejor en desarrollo. Actualiza tu `.env`:

```bash
DATABASE_URL="postgresql://postgres.ljarrjjgajktymlbbumv:[TU-NUEVA-PASSWORD]@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
```

**Nota importante**: 
- Usa el puerto **6543** (transaction pooler)
- El hostname es `aws-1-sa-east-1.pooler.supabase.com` (más confiable)
- Agrega `&pgbouncer=true` al final

## Alternativa: Verificar Network Bans

Si tu IP fue bloqueada por múltiples intentos fallidos:

1. Ve a Supabase Dashboard → **Database** → **Settings** → **Network Bans**
2. Si tu IP está en la lista, elimínala
3. Intenta conectarte de nuevo

## Después de actualizar

1. Guarda el archivo `.env`
2. Reinicia el servidor completamente:
   ```bash
   # Detén el servidor (Ctrl+C)
   npm run dev
   ```
