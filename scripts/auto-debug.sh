#!/bin/bash

# Script para automatizar el proceso de debugging
# Ejecuta tests/builds y reporta errores automáticamente

set -e

DEBUG_QUEUE=".cursor/debug-queue.md"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "🔍 Ejecutando verificación automática..."

# Ejecutar linter
echo "📋 Verificando linter..."
if ! npm run lint 2>&1 | tee /tmp/lint-errors.log; then
    echo "❌ Errores de linter encontrados"
    # Agregar a debug-queue.md
    cat >> "$DEBUG_QUEUE" << EOF

## [$TIMESTAMP] - Errores de Linter

**Contexto**: Verificación automática de linter

**Error**:
\`\`\`
$(cat /tmp/lint-errors.log)
\`\`\`

**Estado**: 🔴 Pendiente
EOF
fi

# Ejecutar build
echo "🏗️  Ejecutando build..."
if ! npm run build 2>&1 | tee /tmp/build-errors.log; then
    echo "❌ Errores de build encontrados"
    cat >> "$DEBUG_QUEUE" << EOF

## [$TIMESTAMP] - Errores de Build

**Contexto**: Build automático falló

**Error**:
\`\`\`
$(tail -50 /tmp/build-errors.log)
\`\`\`

**Estado**: 🔴 Pendiente
EOF
fi

# Verificar tipos de TypeScript
echo "📝 Verificando tipos de TypeScript..."
if ! npx tsc --noEmit 2>&1 | tee /tmp/tsc-errors.log; then
    echo "❌ Errores de tipos encontrados"
    cat >> "$DEBUG_QUEUE" << EOF

## [$TIMESTAMP] - Errores de TypeScript

**Contexto**: Verificación de tipos de TypeScript

**Error**:
\`\`\`
$(tail -50 /tmp/tsc-errors.log)
\`\`\`

**Estado**: 🔴 Pendiente
EOF
fi

# Verificar que el servidor esté corriendo antes de verificar páginas
echo "🌐 Verificando que el servidor esté corriendo..."
if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" | grep -q "200\|302\|307"; then
    echo "✅ Servidor está corriendo, verificando páginas..."
    ./scripts/verify-pages.sh "$BASE_URL" || true
else
    echo "⚠️  Servidor no está corriendo. Inicia con 'npm run dev' antes de verificar páginas."
fi

echo ""
echo "✅ Verificación completada. Revisa $DEBUG_QUEUE para problemas encontrados"
