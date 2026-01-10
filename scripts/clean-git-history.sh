#!/bin/bash

# Script para limpiar credenciales del historial de Git
# ⚠️ ADVERTENCIA: Esto reescribe el historial de Git
# Solo ejecutar si estás seguro y has hecho backup

set -e

echo "⚠️  ADVERTENCIA: Este script reescribirá el historial de Git"
echo "Asegúrate de haber:"
echo "1. Cambiado las credenciales en Supabase"
echo "2. Hecho backup del repositorio"
echo "3. Coordinado con tu equipo (si es un repo compartido)"
echo ""
read -p "¿Continuar? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "Cancelado."
  exit 1
fi

# Credenciales específicas a eliminar
PASSWORD="YoV1ksPOb4A5yzKj"
PROJECT_REF="ljarrjjgajktymlbbumv"

echo "Limpiando historial de Git..."

# Reemplazar password en todos los archivos del historial
echo "Reemplazando password en historial..."
git filter-branch --force --tree-filter \
  "find . -type f \( -name '*.md' -o -name '*.txt' -o -name '*.sh' \) -exec sed -i '' 's/$PASSWORD/[PASSWORD]/g' {} + 2>/dev/null || true" \
  --prune-empty --tag-name-filter cat -- --all

# Reemplazar PROJECT_REF en archivos de documentación
echo "Reemplazando PROJECT_REF en historial..."
git filter-branch --force --tree-filter \
  "find . -type f -name '*.md' -exec sed -i '' 's/$PROJECT_REF/[PROJECT_REF]/g' {} + 2>/dev/null || true" \
  --prune-empty --tag-name-filter cat -- --all

# Limpiar referencias
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo ""
echo "✅ Historial limpiado."
echo ""
echo "⚠️  IMPORTANTE: Ahora debes hacer force push:"
echo "   git push origin --force --all"
echo "   git push origin --force --tags"
echo ""
echo "⚠️  Si es un repo compartido, coordina con tu equipo antes de hacer force push"
