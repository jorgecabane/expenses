#!/bin/bash

# Script para verificar que todas las variables de entorno requeridas estén configuradas

echo "🔍 Verificando variables de entorno..."

required_vars=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "DATABASE_URL"
  "RESEND_API_KEY"
  "NEXT_PUBLIC_APP_URL"
)

missing_vars=()
present_vars=()

for var in "${required_vars[@]}"; do
  if [ -z "${!var}" ]; then
    missing_vars+=("$var")
  else
    present_vars+=("$var")
  fi
done

echo ""
echo "✅ Variables configuradas (${#present_vars[@]}/${#required_vars[@]}):"
for var in "${present_vars[@]}"; do
  value="${!var}"
  # Ocultar valores sensibles
  if [[ "$var" == *"KEY"* ]] || [[ "$var" == *"PASSWORD"* ]] || [[ "$var" == "DATABASE_URL" ]]; then
    echo "  - $var: ${value:0:20}..."
  else
    echo "  - $var: $value"
  fi
done

if [ ${#missing_vars[@]} -gt 0 ]; then
  echo ""
  echo "❌ Variables faltantes (${#missing_vars[@]}):"
  for var in "${missing_vars[@]}"; do
    echo "  - $var"
  fi
  echo ""
  echo "💡 Para configurar en Vercel:"
  echo "   1. Ve a tu proyecto en Vercel Dashboard"
  echo "   2. Settings → Environment Variables"
  echo "   3. Agrega las variables faltantes"
  echo ""
  echo "💡 Para desarrollo local, crea un archivo .env.local con:"
  for var in "${missing_vars[@]}"; do
    echo "   $var=tu_valor_aqui"
  done
  exit 1
else
  echo ""
  echo "✨ ¡Todas las variables están configuradas!"
  exit 0
fi
