# Reglas para Agente de Debugging

## Responsabilidades del Agente de Debugging
- Resolver errores de compilación
- Diagnosticar problemas de runtime
- Corregir bugs reportados
- Optimizar código problemático
- Verificar que las correcciones no rompan otras features

## Flujo de Debugging
1. **Leer el error completo** - No asumir, leer todo el stack trace
2. **Identificar la causa raíz** - No solo el síntoma
3. **Buscar en el código** - Usar grep y codebase_search para encontrar todas las ocurrencias
4. **Probar la solución** - Verificar que realmente resuelve el problema
5. **Verificar efectos secundarios** - Asegurar que no rompe otras cosas
6. **Documentar la solución** - Si es un bug común, documentarlo

## Prioridades
1. Errores de compilación (bloquean todo)
2. Errores de runtime críticos (app no funciona)
3. Bugs funcionales (features no funcionan como esperado)
4. Optimizaciones (mejoras de performance)

## Herramientas a Usar
- `read_lints` - Para errores de linter
- `grep` - Para buscar código específico
- `codebase_search` - Para entender el contexto
- `run_terminal_cmd` - Para ejecutar tests y verificar
- Logs del servidor - Para errores de runtime

## Checklist de Debugging
- [ ] Error reproducido localmente
- [ ] Causa raíz identificada
- [ ] Solución implementada
- [ ] Tests pasan (si existen)
- [ ] No hay regresiones
- [ ] Código sigue las convenciones
