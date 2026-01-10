# Configuración del Cron Job para Transacciones Recurrentes

## Descripción

El cron job se ejecuta diariamente a las **00:00 UTC** para generar transacciones recurrentes (gastos e ingresos) según su configuración.

## Configuración en Vercel

### 1. Variable de Entorno

Agrega en Vercel Dashboard → Settings → Environment Variables:

```
CRON_SECRET=tu-secret-aleatorio-aqui
```

**Importante**: Genera un secret aleatorio y seguro. Puedes usar:
```bash
openssl rand -hex 32
```

### 2. Configuración del Cron

El cron job ya está configurado en `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/recurring-transactions",
      "schedule": "0 0 * * *"
    }
  ]
}
```

Esto ejecutará el endpoint diariamente a las 00:00 UTC.

### 3. Verificar que Funciona

Después de hacer deploy, puedes verificar en Vercel Dashboard → Cron Jobs que el job esté configurado.

## Testing Local

Para probar el cron job localmente:

```bash
# Hacer una request GET al endpoint
curl http://localhost:3000/api/cron/recurring-transactions
```

**Nota**: En desarrollo, la autenticación está deshabilitada para facilitar el testing.

## Qué Hace el Cron Job

1. Busca todos los gastos e ingresos con `isRecurring = true`
2. Para cada uno:
   - Verifica si está pausado (`isPaused`)
   - Verifica condiciones de fin (`endDate`, `endAfter`)
   - Calcula si debe generarse una transacción hoy usando `shouldGenerateTransaction()`
   - Verifica que no exista ya una transacción para hoy
   - Crea una nueva transacción si corresponde
   - Actualiza `lastProcessed` en el template

## Respuesta del Endpoint

```json
{
  "success": true,
  "date": "2024-01-15T00:00:00.000Z",
  "expensesProcessed": 5,
  "expensesCreated": 2,
  "incomesProcessed": 3,
  "incomesCreated": 1,
  "errors": []
}
```

## Troubleshooting

### El cron no se ejecuta

1. Verifica que `vercel.json` tenga la configuración correcta
2. Verifica que el cron esté habilitado en Vercel Dashboard
3. Revisa los logs en Vercel Dashboard → Functions → Cron Jobs

### Transacciones duplicadas

El cron verifica que no exista ya una transacción para la fecha antes de crear una nueva. Si hay duplicados, puede ser por:
- El cron se ejecutó múltiples veces
- Se creó manualmente una transacción para esa fecha

### Transacciones no generadas

Verifica:
1. Que `isRecurring = true` en el template
2. Que `isPaused != true` en `recurringConfig`
3. Que la fecha de hoy corresponda según la lógica de recurrencia
4. Que no se haya alcanzado la condición de fin (`endDate` o `endAfter`)
