# Diseño de Gastos e Ingresos Recurrentes

## Estructura de `recurringConfig` (JSON)

```typescript
interface RecurringConfig {
  // Tipo de recurrencia
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'
  
  // Para custom: repetir cada X unidades
  interval?: number  // Ej: cada 2 semanas, cada 3 meses
  
  // Unidad para custom
  intervalUnit?: 'day' | 'week' | 'month' | 'year'
  
  // Para weekly y custom: días de la semana [0-6] donde 0 = domingo
  // Para monthly: día del mes [1-31] o { ordinal: 1-4, dayOfWeek: 0-6 }
  // Para yearly: { month: 1-12, day: 1-31 }
  days?: number[] | { ordinal: number; dayOfWeek: number } | { month: number; day: number }
  
  // Condiciones de fin
  endType: 'never' | 'on_date' | 'after'
  endDate?: string   // ISO date string
  endAfter?: number  // Número de ocurrencias
  
  // Fecha de inicio (la fecha del gasto/ingreso original)
  startDate: string  // ISO date string
  
  // Estado
  isPaused?: boolean  // Si está pausado, no generar más transacciones
  lastProcessed?: string  // ISO date string - última fecha procesada por el cron
}
```

## Opciones Rápidas (basadas en fecha seleccionada)

Cuando el usuario selecciona una fecha y marca "recurrente", mostrar opciones inteligentes:

1. **Cada día** → `{ type: 'daily', endType: 'never' }`
2. **Cada semana el [día]** → `{ type: 'weekly', days: [dayOfWeek], endType: 'never' }`
3. **Cada mes el [ordinal] [día]** → `{ type: 'monthly', days: { ordinal: 2, dayOfWeek: 6 }, endType: 'never' }`
4. **Anualmente el [día] de [mes]** → `{ type: 'yearly', days: { month: 1, day: 10 }, endType: 'never' }`
5. **Personalizar...** → Abre modal de personalización

## Ejemplos de Configuración

### Gasto mensual (suscripción Netflix) - Opción rápida
```json
{
  "type": "monthly",
  "days": [15],  // Día 15 de cada mes
  "endType": "never",
  "startDate": "2024-01-15T00:00:00Z"
}
```

### Ingreso quincenal (sueldo) - Personalizado
```json
{
  "type": "custom",
  "interval": 2,
  "intervalUnit": "week",
  "days": [1],  // Lunes
  "endType": "never",
  "startDate": "2024-01-01T00:00:00Z"
}
```

### Gasto semanal (supermercado) - Opción rápida
```json
{
  "type": "weekly",
  "days": [0],  // Todos los domingos
  "endType": "after",
  "endAfter": 12,
  "startDate": "2024-01-07T00:00:00Z"
}
```

### Gasto mensual segundo sábado - Opción rápida
```json
{
  "type": "monthly",
  "days": { "ordinal": 2, "dayOfWeek": 6 },  // Segundo sábado
  "endType": "never",
  "startDate": "2024-01-13T00:00:00Z"
}
```

### Gasto anual - Opción rápida
```json
{
  "type": "yearly",
  "days": { "month": 1, "day": 10 },  // 10 de enero
  "endType": "on_date",
  "endDate": "2025-01-10T00:00:00Z",
  "startDate": "2024-01-10T00:00:00Z"
}
```

## Flujo de Implementación

### 1. Actualizar Schema
- Agregar `isRecurring` y `recurringConfig` a `Income`
- Agregar campo `isPaused` para pausar recurrencias

### 2. UI de Configuración (Tipo Google Calendar)

#### Paso 1: Checkbox "¿Es recurrente?"
- Al marcar, mostrar dropdown con opciones rápidas basadas en la fecha seleccionada

#### Paso 2: Opciones Rápidas
- Calcular automáticamente basado en la fecha:
  - Cada día
  - Cada semana el [día de la semana]
  - Cada mes el [ordinal] [día] (ej: segundo sábado)
  - Anualmente el [día] de [mes]
  - Personalizar...

#### Paso 3: Modal de Personalización
- **Repetir cada**: [input numérico] [selector: día/semana/mes/año]
- **Se repite el**: Selector múltiple de días (L M X J V S D)
- **Termina**:
  - ○ Nunca
  - ○ El [input fecha]
  - ○ Después de [input número] repeticiones

### 3. Sección de Recurrentes
- Nueva sección en `/dashboard/expenses` y `/dashboard/incomes`
- Mostrar solo los templates recurrentes (no las transacciones generadas)
- Acciones:
  - Editar template
  - Pausar/Reanudar
  - Eliminar (detiene futuras generaciones)

### 4. Edición de Transacciones Recurrentes
- Al editar una transacción generada, mostrar diálogo:
  - "¿Aplicar cambios solo a esta ocurrencia o a todas las futuras?"
  - Si "solo esta": Crear nueva transacción editada, mantener template
  - Si "todas futuras": Actualizar template y todas las futuras

### 5. Cron Job (Vercel Cron)
- Endpoint: `/api/cron/recurring-transactions`
- Ejecutar diariamente a las 00:00 UTC
- Buscar todos los gastos/ingresos con `isRecurring = true` y `isPaused != true`
- Para cada uno:
  - Calcular si debe generar una nueva transacción hoy
  - Verificar condiciones de fin
  - Verificar que no exista ya una transacción para esa fecha
  - Crear nueva transacción si corresponde
  - Actualizar `lastProcessed` en `recurringConfig`

### 6. Lógica de Cálculo
```typescript
function shouldGenerateTransaction(config: RecurringConfig, today: Date, startDate: Date): boolean {
  // Verificar si está pausado
  if (config.isPaused) return false
  
  // Verificar condiciones de fin
  if (config.endType === 'on_date' && config.endDate) {
    if (today > new Date(config.endDate)) return false
  }
  
  if (config.endType === 'after' && config.endAfter) {
    // Contar cuántas transacciones ya se generaron
    const count = await countGeneratedTransactions(config)
    if (count >= config.endAfter) return false
  }
  
  // Calcular si hoy corresponde según el tipo
  switch (config.type) {
    case 'daily':
      return true
    case 'weekly':
      return config.days?.includes(today.getDay())
    case 'monthly':
      // Verificar si es día específico o ordinal + día de semana
    case 'yearly':
      // Verificar mes y día
    case 'custom':
      // Calcular basado en interval e intervalUnit
  }
}
```

## Decisiones Tomadas

1. **Primera transacción**: Se crea inmediatamente en la fecha seleccionada
2. **Edición**: Por defecto afecta solo esa ocurrencia, pero se pregunta si afecta futuras
3. **Visualización**: Mostrar templates recurrentes editables, transacciones generadas en reportes
4. **Pausa**: Permitir pausar y reanudar recurrencias
5. **Eliminación**: Eliminar template detiene futuras generaciones
