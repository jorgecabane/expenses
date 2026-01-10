#!/bin/bash

# Script para probar el dashboard después del login

echo "🔍 Probando acceso al dashboard..."
echo ""

# Verificar que el servidor esté corriendo
if ! curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|302\|307"; then
    echo "❌ Servidor no está corriendo. Ejecuta: npm run dev"
    exit 1
fi

echo "✅ Servidor está corriendo"
echo ""

# Probar rutas
echo "📋 Probando rutas:"
echo ""

echo -n "  /dashboard: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -L http://localhost:3000/dashboard 2>&1)
if [ "$STATUS" = "200" ]; then
    echo "✅ ($STATUS)"
elif [ "$STATUS" = "302" ] || [ "$STATUS" = "307" ]; then
    echo "⚠️  ($STATUS - Redirige, probablemente a /login)"
else
    echo "❌ ($STATUS)"
fi

echo -n "  /dashboard/setup: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -L http://localhost:3000/dashboard/setup 2>&1)
if [ "$STATUS" = "200" ]; then
    echo "✅ ($STATUS)"
elif [ "$STATUS" = "302" ] || [ "$STATUS" = "307" ]; then
    echo "⚠️  ($STATUS - Redirige)"
else
    echo "❌ ($STATUS)"
fi

echo ""
echo "💡 Si obtienes 404, verifica:"
echo "   1. Que el servidor esté corriendo: npm run dev"
echo "   2. Que hayas hecho login correctamente"
echo "   3. Revisa los logs del servidor para errores"
echo "   4. Revisa la consola del navegador para errores"
