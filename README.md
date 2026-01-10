# Bolsillos - Sistema de Gestión de Gastos Familiares

**Tu dinero, organizado**

Aplicación web para gestionar gastos familiares usando el método de bolsillos (envelope method), inspirado en Goodbudget.

## Características

- ✅ Autenticación con Supabase (OAuth + email/password)
- ✅ Grupos familiares con invitaciones por email
- ✅ Bolsillos compartidos y personales
- ✅ Asignación mensual de presupuesto
- ✅ Seguimiento de gastos con categorías
- ✅ Dashboard con resumen del mes
- ✅ Ingresos y metas de ahorro
- ✅ UI moderna con Tailwind CSS y shadcn/ui

## Stack Tecnológico

- **Frontend/Backend**: Next.js 14 (App Router)
- **Base de Datos**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **ORM**: Prisma
- **UI**: Tailwind CSS + shadcn/ui
- **Email**: Resend
- **Hosting**: Vercel (recomendado)

## Setup

### 1. Clonar y instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

#### Para Desarrollo Local

Copia `.env.example` a `.env.local` y completa las variables:

```bash
cp .env.example .env.local
```

Variables necesarias:

- `NEXT_PUBLIC_SUPABASE_URL`: URL de tu proyecto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Anon key de Supabase
- `DATABASE_URL`: Connection string de PostgreSQL (de Supabase)
- `RESEND_API_KEY`: API key de Resend para emails
- `NEXT_PUBLIC_APP_URL`: URL de tu app (http://localhost:3000 para desarrollo)

#### Para Vercel (Producción)

**Opción Recomendada: Integración Automática con Supabase**

1. En Vercel Dashboard → Tu Proyecto → **Settings** → **Integrations**
2. Busca **Supabase** y haz click en **Add Integration**
3. Selecciona tu proyecto de Supabase
4. Vercel automáticamente agregará `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Variables Adicionales Manuales en Vercel:**

1. Ve a **Settings** → **Environment Variables**
2. Agrega:
   - `DATABASE_URL`: Connection string de PostgreSQL (desde Supabase Dashboard → Settings → Database)
   - `RESEND_API_KEY`: Tu API key de Resend
   - `NEXT_PUBLIC_APP_URL`: URL de producción (ej: `https://tu-app.vercel.app`)

📖 **Guía completa**: Ver [VERCEL_SETUP.md](./VERCEL_SETUP.md) para instrucciones detalladas.

### 3. Configurar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Obtén la URL y anon key desde Settings > API
3. Obtén la connection string desde Settings > Database > Connection string (URI)

### 4. Configurar Resend

1. Crea una cuenta en [Resend](https://resend.com)
2. Obtén tu API key desde la dashboard
3. Configura un dominio (opcional, puedes usar el dominio por defecto para desarrollo)

### 5. Ejecutar migraciones de Prisma

```bash
npx prisma generate
npx prisma db push
```

O si prefieres usar migraciones:

```bash
npx prisma migrate dev --name init
```

### 6. Verificar variables de entorno (Opcional)

```bash
npm run verify-env
```

Este script verifica que todas las variables necesarias estén configuradas.

### 7. Ejecutar el proyecto

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## Deploy a Vercel

### Opción 1: Desde GitHub (Recomendado)

1. Sube tu código a GitHub
2. En [Vercel Dashboard](https://vercel.com), click en **Add New Project**
3. Importa tu repositorio de GitHub
4. Vercel detectará automáticamente Next.js
5. Configura las variables de entorno (ver [VERCEL_SETUP.md](./VERCEL_SETUP.md))
6. Click **Deploy**

### Opción 2: Desde CLI

```bash
npm i -g vercel
vercel
```

Sigue las instrucciones y configura las variables de entorno cuando se te solicite.

## Estructura del Proyecto

```
expenses/
├── app/
│   ├── (auth)/          # Rutas de autenticación
│   ├── (dashboard)/      # Rutas del dashboard
│   ├── api/             # API routes
│   └── ...
├── components/          # Componentes React
│   ├── ui/              # Componentes shadcn/ui
│   └── ...
├── lib/                 # Utilidades y helpers
│   ├── supabase/        # Clientes de Supabase
│   ├── auth.ts          # Funciones de autenticación
│   ├── expenses.ts      # Lógica de gastos
│   ├── pockets.ts       # Lógica de bolsillos
│   └── ...
├── prisma/
│   └── schema.prisma    # Schema de base de datos
└── types/               # Tipos TypeScript
```

## Funcionalidades Principales

### Grupos Familiares

- Crear grupos para compartir finanzas
- Invitar miembros por email
- Múltiples grupos por usuario
- Privacidad entre grupos

### Bolsillos

- **Compartidos**: Todos los miembros pueden ver y editar
- **Personales**: Todos pueden ver, solo el dueño puede editar
- Asignación mensual de presupuesto
- Visualización de estado (saludable, atención, crítico, agotado)

### Gastos

- Entrada rápida con selector visual de categoría
- Soporte para gastos compartidos con división
- Historial de gastos
- Gastos recurrentes (futuro)

### Dashboard

- Resumen del mes
- Visualización de bolsillos
- Gasto diario promedio vs recomendado
- Gastos recientes

## Próximos Pasos

- [ ] Página de configuración completa
- [ ] Reportes históricos con gráficos
- [ ] Transferencias entre bolsillos
- [ ] Gastos recurrentes con Vercel Cron Jobs
- [ ] Exportación a CSV
- [ ] Notificaciones push
- [ ] PWA para móvil

## Licencia

MIT
