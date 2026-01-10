#!/bin/bash

# Script para diagnosticar problemas de 404 en Next.js

set -e

echo "🔍 Diagnóstico de 404 en Next.js"
echo "=================================="
echo ""

# 1. Verificar estructura de archivos
echo "1️⃣ Verificando estructura de archivos..."
if [ -f "app/(dashboard)/page.tsx" ]; then
    echo "   ✅ app/(dashboard)/page.tsx existe"
else
    echo "   ❌ app/(dashboard)/page.tsx NO existe"
fi

if [ -f "app/(dashboard)/setup/page.tsx" ]; then
    echo "   ✅ app/(dashboard)/setup/page.tsx existe"
else
    echo "   ❌ app/(dashboard)/setup/page.tsx NO existe"
fi

if [ -f "app/(dashboard)/layout.tsx" ]; then
    echo "   ✅ app/(dashboard)/layout.tsx existe"
else
    echo "   ❌ app/(dashboard)/layout.tsx NO existe"
fi

if [ -f "middleware.ts" ]; then
    echo "   ✅ middleware.ts existe"
else
    echo "   ❌ middleware.ts NO existe"
fi

echo ""

# 2. Verificar errores de sintaxis
echo "2️⃣ Verificando errores de sintaxis..."
if npx tsc --noEmit 2>&1 | grep -q "error"; then
    echo "   ❌ Errores de TypeScript encontrados:"
    npx tsc --noEmit 2>&1 | grep "error" | head -5
else
    echo "   ✅ No hay errores de TypeScript"
fi

echo ""

# 3. Verificar build
echo "3️⃣ Verificando build..."
if npm run build 2>&1 | grep -q "Error\|Failed"; then
    echo "   ❌ Build falló"
    npm run build 2>&1 | grep -E "Error|Failed" | head -10
else
    echo "   ✅ Build exitoso"
fi

echo ""

# 4. Verificar que el servidor esté corriendo
echo "4️⃣ Verificando servidor..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|302\|307"; then
    echo "   ✅ Servidor está corriendo"
    
    # 5. Probar rutas específicas
    echo ""
    echo "5️⃣ Probando rutas..."
    
    echo -n "   /dashboard: "
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dashboard)
    if [ "$STATUS" = "200" ] || [ "$STATUS" = "302" ] || [ "$STATUS" = "307" ]; then
        echo "✅ ($STATUS)"
    else
        echo "❌ ($STATUS)"
    fi
    
    echo -n "   /dashboard/setup: "
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dashboard/setup)
    if [ "$STATUS" = "200" ] || [ "$STATUS" = "302" ] || [ "$STATUS" = "307" ]; then
        echo "✅ ($STATUS)"
    else
        echo "❌ ($STATUS)"
    fi
else
    echo "   ⚠️  Servidor NO está corriendo"
    echo "   💡 Ejecuta: npm run dev"
fi

echo ""
echo "=================================="
echo "✅ Diagnóstico completado"
