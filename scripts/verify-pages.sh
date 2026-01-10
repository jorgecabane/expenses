#!/bin/bash

# Script para verificar que las páginas funcionan correctamente
# Hace GET requests a las rutas principales

set -e

BASE_URL="${1:-http://localhost:3000}"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
DEBUG_QUEUE=".cursor/debug-queue.md"

echo "🔍 Verificando páginas en $BASE_URL..."

# Función para verificar una ruta
check_route() {
    local route=$1
    local expected_status=${2:-200}
    
    echo -n "  Verificando $route... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$route" 2>&1 || echo "000")
    
    if [ "$response" = "$expected_status" ] || [ "$response" = "302" ] || [ "$response" = "307" ]; then
        echo "✅ OK ($response)"
        return 0
    else
        echo "❌ ERROR ($response)"
        return 1
    fi
}

# Rutas públicas (deben funcionar sin auth)
echo "📋 Verificando rutas públicas..."
PUBLIC_ERRORS=0
check_route "/login" || PUBLIC_ERRORS=$((PUBLIC_ERRORS + 1))
check_route "/register" || PUBLIC_ERRORS=$((PUBLIC_ERRORS + 1))

# Rutas protegidas (pueden redirigir a login si no hay auth, eso es OK)
echo ""
echo "📋 Verificando rutas protegidas (pueden redirigir a /login)..."
PROTECTED_ERRORS=0
check_route "/dashboard" || PROTECTED_ERRORS=$((PROTECTED_ERRORS + 1))
check_route "/dashboard/setup" || PROTECTED_ERRORS=$((PROTECTED_ERRORS + 1))
check_route "/dashboard/expenses" || PROTECTED_ERRORS=$((PROTECTED_ERRORS + 1))
check_route "/dashboard/reports" || PROTECTED_ERRORS=$((PROTECTED_ERRORS + 1))
check_route "/dashboard/settings" || PROTECTED_ERRORS=$((PROTECTED_ERRORS + 1))

# API routes
echo ""
echo "📋 Verificando API routes..."
API_ERRORS=0
check_route "/api/groups" 401 || API_ERRORS=$((API_ERRORS + 1))  # 401 es OK sin auth

# Resumen
echo ""
echo "📊 Resumen:"
echo "  Rutas públicas: $PUBLIC_ERRORS errores"
echo "  Rutas protegidas: $PROTECTED_ERRORS errores"
echo "  API routes: $API_ERRORS errores"

TOTAL_ERRORS=$((PUBLIC_ERRORS + PROTECTED_ERRORS + API_ERRORS))

if [ $TOTAL_ERRORS -gt 0 ]; then
    echo ""
    echo "❌ Se encontraron $TOTAL_ERRORS errores"
    
    # Agregar a debug-queue si hay errores críticos (404)
    if [ $PUBLIC_ERRORS -gt 0 ] || [ $PROTECTED_ERRORS -gt 0 ]; then
        cat >> "$DEBUG_QUEUE" << EOF

## [$TIMESTAMP] - Errores de Rutas (404)

**Contexto**: Verificación automática de páginas

**Error**:
- Rutas públicas con error: $PUBLIC_ERRORS
- Rutas protegidas con error: $PROTECTED_ERRORS
- API routes con error: $API_ERRORS

**Rutas verificadas**:
- /login
- /register
- /dashboard
- /dashboard/setup
- /dashboard/expenses
- /dashboard/reports
- /dashboard/settings

**Estado**: 🔴 Pendiente
EOF
    fi
    
    exit 1
else
    echo "✅ Todas las rutas funcionan correctamente"
    exit 0
fi
