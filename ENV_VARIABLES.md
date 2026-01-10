# Variables de Entorno Requeridas

## 🔐 Variables Obligatorias

### 1. **CRON_SECRET** ⚠️ **NUEVA - REQUERIDA**
- **Descripción**: Secret para proteger el endpoint del cron job de transacciones recurrentes
- **Cómo generar**:
  ```bash
  openssl rand -hex 32
  ```
- **Ejemplo generado**: `2e3b9835b1b5b43d7efb7dfb04294f2008ab5fc1354334e90bf7aa50e70501a0`
- **Dónde agregar**: Vercel Dashboard → Settings → Environment Variables
- **Entornos**: Production (obligatorio), Preview (opcional), Development (no necesario, está deshabilitado en dev)

### 2. **DATABASE_URL**
- **Descripción**: Connection string de PostgreSQL para Prisma
- **Cómo obtener**: 
  - En Supabase Dashboard → Settings → Database → Connection string
  - O mapear desde `POSTGRES_PRISMA_URL` (recomendado)
- **Formato**: `postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres?sslmode=require`
- **Dónde agregar**: Vercel Dashboard → Settings → Environment Variables

### 3. **NEXT_PUBLIC_SUPABASE_URL**
- **Descripción**: URL del proyecto de Supabase
- **Cómo obtener**: Supabase Dashboard → Settings → API → Project URL
- **Dónde agregar**: Automática si tienes integración Supabase-Vercel, o manualmente

### 4. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
- **Descripción**: Clave pública/anónima de Supabase
- **Cómo obtener**: Supabase Dashboard → Settings → API → anon/public key
- **Dónde agregar**: Automática si tienes integración Supabase-Vercel, o manualmente

### 5. **RESEND_API_KEY**
- **Descripción**: API key de Resend para enviar emails
- **Cómo obtener**: [Resend Dashboard](https://resend.com/api-keys) → Create API Key
- **Dónde agregar**: Vercel Dashboard → Settings → Environment Variables

### 6. **NEXT_PUBLIC_APP_URL**
- **Descripción**: URL pública de tu aplicación
- **Ejemplo**: `https://tu-proyecto.vercel.app`
- **Dónde agregar**: Vercel Dashboard → Settings → Environment Variables
- **Nota**: Después del primer deploy, copia la URL de Vercel

## 📧 Variables Opcionales (con defaults)

### 7. **EMAIL_FROM** (Opcional)
- **Descripción**: Remitente de los emails de invitación
- **Default**: `Bolsillos <onboarding@resend.dev>`
- **Formato recomendado**: `Nombre <email@tudominio.com>`
- **Dónde agregar**: Vercel Dashboard → Settings → Environment Variables
- **Nota**: Si tienes un dominio verificado en Resend, usa ese email

## ❌ Variables que NO debes agregar en producción

### **NODE_TLS_REJECT_UNAUTHORIZED** ⚠️
- **Descripción**: Variable global de Node.js que deshabilita la verificación de certificados SSL
- **Uso**: Solo para desarrollo local cuando hay problemas con certificados self-signed
- **En producción**: **NO agregar** - Es un riesgo de seguridad grave
- **Razón**: 
  - El código ya maneja SSL correctamente en `lib/prisma.ts` con `rejectUnauthorized: false` solo para conexiones a Supabase
  - En producción, Vercel y Supabase manejan SSL correctamente sin necesidad de esta variable
  - Deshabilitar la verificación SSL globalmente expone tu aplicación a ataques man-in-the-middle
- **Si la tienes en `.env` local**: Está bien para desarrollo, pero **nunca** la subas a Vercel

## 📋 Resumen Rápido

### Para Producción (Vercel):

```bash
# Obligatorias
CRON_SECRET=tu-secret-generado-con-openssl
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
RESEND_API_KEY=re_...
NEXT_PUBLIC_APP_URL=https://tu-proyecto.vercel.app

# Opcionales
EMAIL_FROM=Bolsillos <noreply@tudominio.com>
```

### Para Desarrollo Local (.env.local):

```bash
# Obligatorias
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
RESEND_API_KEY=re_...
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Opcionales
EMAIL_FROM=Bolsillos <noreply@tudominio.com>

# CRON_SECRET no es necesario en desarrollo (está deshabilitado)
```

## 🔧 Cómo Generar CRON_SECRET

### Opción 1: OpenSSL (Recomendado)
```bash
openssl rand -hex 32
```

### Opción 2: Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Opción 3: Online
Puedes usar cualquier generador de strings aleatorios, pero asegúrate de que sea seguro (mínimo 32 caracteres).

## ✅ Checklist de Configuración

- [ ] `CRON_SECRET` generado y agregado en Vercel (Production)
- [ ] `DATABASE_URL` configurado (o mapeado desde `POSTGRES_PRISMA_URL`)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` configurado
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configurado
- [ ] `RESEND_API_KEY` configurado
- [ ] `NEXT_PUBLIC_APP_URL` configurado con la URL de producción
- [ ] `EMAIL_FROM` configurado (opcional, pero recomendado)

## 🧪 Verificar Configuración

Puedes usar el script de verificación:

```bash
chmod +x scripts/verify-env.sh
./scripts/verify-env.sh
```

O verificar manualmente en Vercel Dashboard → Settings → Environment Variables.

## 🔒 Seguridad

- **Nunca** commitees variables de entorno a Git
- **Nunca** compartas tus secrets públicamente
- Usa diferentes valores para Development, Preview y Production cuando sea posible
- Rota tus secrets periódicamente (especialmente si sospechas que fueron comprometidos)
