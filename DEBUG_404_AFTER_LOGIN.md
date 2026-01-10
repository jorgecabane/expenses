# Debug: 404 después de login con Google

## Problema

Después de hacer login con Google, el usuario es redirigido a `/dashboard` pero obtiene un 404.

## Diagnóstico

### Posibles causas:

1. **Error en `getCurrentUser()`**: El usuario no se crea correctamente en la BD
2. **Error en `getUserGroups()`**: Error al consultar la BD
3. **Error de Prisma**: Problema de conexión o query
4. **Error en tiempo de render**: La página falla al renderizar

## Soluciones implementadas

### 1. Manejo de errores mejorado en `getCurrentUser()`

```typescript
// Manejo de race condition al crear usuario
if (!dbUser) {
  try {
    await prisma.user.create({...})
  } catch (error: any) {
    if (error.code !== 'P2002') {
      throw error
    }
  }
}
```

### 2. Manejo de errores en `DashboardPage`

```typescript
export default async function DashboardPage() {
  try {
    // ... código existente
  } catch (error) {
    console.error('Error in DashboardPage:', error)
    redirect('/dashboard/setup')
  }
}
```

### 3. Manejo de errores en `SetupPage`

Similar al dashboard, con mensaje de error visible.

## Cómo debuggear

### 1. Verificar logs del servidor

Cuando accedas a `/dashboard`, revisa los logs del servidor para ver si hay errores:

```bash
npm run dev
# Luego accede a /dashboard y revisa los logs
```

### 2. Verificar que el usuario existe en la BD

```sql
-- En Supabase SQL Editor
SELECT * FROM users WHERE email = 'tu-email@gmail.com';
```

### 3. Verificar que no hay errores de Prisma

Los errores de Prisma aparecerán en los logs del servidor. Busca:
- `PrismaClientKnownRequestError`
- `PrismaClientValidationError`
- `Error opening a TLS connection`

### 4. Verificar la consola del navegador

Abre las DevTools (F12) y revisa:
- **Console**: Errores de JavaScript
- **Network**: Ver qué requests fallan

### 5. Probar directamente

```bash
# Probar que el servidor responde
curl http://localhost:3000/dashboard

# Ver el código de respuesta
curl -I http://localhost:3000/dashboard
```

## Próximos pasos si el problema persiste

1. **Agregar logging detallado**:
   ```typescript
   console.log('getCurrentUser - user:', user?.id)
   console.log('getCurrentUser - dbUser:', dbUser?.id)
   console.log('getUserGroups - userId:', user.id)
   console.log('getUserGroups - groups:', groups.length)
   ```

2. **Verificar variables de entorno**:
   ```bash
   npm run verify-env
   ```

3. **Verificar conexión a Supabase**:
   - Revisa que `DATABASE_URL` esté correcto
   - Revisa que las credenciales de Supabase sean correctas

4. **Limpiar caché y rebuild**:
   ```bash
   rm -rf .next
   npm run build
   npm run dev
   ```

## Comandos útiles

```bash
# Verificar rutas
npm run debug:404

# Verificar páginas
npm run debug:pages

# Verificar todo
npm run debug:check

# Probar dashboard
./scripts/test-dashboard.sh
```
