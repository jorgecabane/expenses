# Flujo de Trabajo con Agentes

## Cómo Usar Este Sistema

### Para Desarrollo de Features

1. **Asigna la tarea al Agente de Desarrollo**:
   ```
   "Implementa [feature] según el plan. Si encuentras errores que no puedes resolver, 
   documenta el problema en .cursor/debug-queue.md y continúa con la siguiente tarea."
   ```

2. El agente de desarrollo:
   - Lee el plan completo
   - Implementa la feature
   - Si encuentra errores, los documenta en `debug-queue.md`
   - Marca la tarea como completada

### Para Debugging

1. **Asigna la tarea al Agente de Debugging**:
   ```
   "Revisa .cursor/debug-queue.md y resuelve todos los problemas pendientes. 
   Sigue las reglas en .cursor/debug-rules.md"
   ```

2. El agente de debugging:
   - Lee `debug-queue.md`
   - Para cada problema:
     - Identifica la causa raíz
     - Implementa la solución
     - Verifica que funciona
     - Marca como resuelto
   - Actualiza el estado en `debug-queue.md`

## Ejemplo de Uso

### Paso 1: Desarrollo
```
Usuario: "Implementa la feature de reportes mensuales según el plan"
→ Agente de Desarrollo trabaja
→ Encuentra un error de tipo en Prisma
→ Documenta en debug-queue.md
→ Continúa con siguiente feature
```

### Paso 2: Debugging
```
Usuario: "Revisa y resuelve los problemas en debug-queue.md"
→ Agente de Debugging lee debug-queue.md
→ Identifica el problema de Prisma
→ Corrige el tipo
→ Verifica que funciona
→ Marca como resuelto
```

## Automatización Avanzada

### Script de Monitoreo (Opcional)

Puedes crear un script que:
1. Ejecuta tests/builds
2. Si hay errores, los agrega automáticamente a `debug-queue.md`
3. Notifica al agente de debugging

### Integración con CI/CD

En Vercel/GitHub Actions:
- Si el build falla, crear un issue automático
- El agente de debugging puede leer estos issues
