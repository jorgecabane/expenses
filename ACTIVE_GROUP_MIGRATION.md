# Migración: Guardar Grupo Activo en Base de Datos

## Paso 1: Ejecutar Migración SQL en Supabase

Antes de poder usar el código, necesitas agregar la columna `active_group_id` a la tabla `users`.

1. Ve a [Supabase Dashboard](https://app.supabase.com) → Tu proyecto
2. **SQL Editor** → **New query**
3. Copia y pega el contenido de `migrations/add_active_group_id_to_users.sql`
4. Click **Run** para ejecutar la migración

## Paso 2: Generar Tipos de Prisma

Después de ejecutar la migración SQL, genera los tipos de Prisma:

```bash
npx prisma generate
```

## Cómo Funciona

### 1. Al cargar el dashboard por primera vez:
- Las páginas del servidor leen `user.activeGroupId` de la base de datos
- Si existe y el usuario tiene acceso, se usa ese grupo
- Si no existe, se usa el primer grupo disponible y se guarda automáticamente

### 2. Al cambiar de grupo:
- El layout actualiza `user.activeGroupId` en la base de datos
- Usa `router.refresh()` para refrescar los Server Components sin recargar toda la página
- Todas las páginas (dashboard, gastos, ingresos, reportes) se actualizan automáticamente

### 3. Ventajas sobre cookies:
- ✅ Persiste entre dispositivos
- ✅ No requiere recargar la página completa
- ✅ Más robusto y mantenible
- ✅ Estándar para preferencias de usuario

## Verificación

Después de ejecutar la migración y generar los tipos:

1. Reinicia el servidor de desarrollo: `npm run dev`
2. Inicia sesión
3. Verifica que el dashboard cargue con el grupo correcto desde el inicio
4. Cambia de grupo y verifica que se actualice sin recargar toda la página
