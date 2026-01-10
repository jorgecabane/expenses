# 🤖 Flujo de Trabajo con Agentes de IA

Este proyecto está configurado para trabajar con dos tipos de agentes especializados:

## 👨‍💻 Agente de Desarrollo
**Responsabilidad**: Implementar nuevas features y funcionalidades

### Cómo usar:
```
"Implementa [feature] según el plan. Si encuentras errores que no puedes resolver, 
documenta el problema en .cursor/debug-queue.md y continúa con la siguiente tarea."
```

### Qué hace:
- ✅ Lee el plan completo antes de empezar
- ✅ Implementa features una a la vez
- ✅ Verifica que el código compile
- ✅ Si encuentra errores, los documenta en `debug-queue.md`
- ✅ Marca tareas como completadas

### Reglas:
Ver `.cursorrules` para las reglas completas del agente de desarrollo.

---

## 🐛 Agente de Debugging
**Responsabilidad**: Resolver errores y bugs

### Cómo usar:
```
"Revisa .cursor/debug-queue.md y resuelve todos los problemas pendientes. 
Sigue las reglas en .cursor/debug-rules.md"
```

### Qué hace:
- ✅ Lee la cola de debugging
- ✅ Identifica la causa raíz de cada problema
- ✅ Implementa soluciones
- ✅ Verifica que las correcciones funcionen
- ✅ Marca problemas como resueltos

### Reglas:
Ver `.cursor/debug-rules.md` para las reglas completas del agente de debugging.

---

## 🔄 Flujo Recomendado

### 1. Desarrollo de Features
```bash
# 1. Asigna tarea al agente de desarrollo
"Implementa la feature X según el plan"

# 2. Si hay errores, el agente los documenta automáticamente
# 3. Continúa con la siguiente feature
```

### 2. Debugging Periódico
```bash
# 1. Ejecuta verificación automática
npm run debug:check

# 2. Revisa la cola de debugging
npm run debug:queue

# 3. Asigna tarea al agente de debugging
"Revisa y resuelve los problemas en debug-queue.md"
```

### 3. Debugging Manual
Si encuentras un error manualmente:
1. Agrega el problema a `.cursor/debug-queue.md`
2. Asigna al agente de debugging: `"Resuelve el problema en debug-queue.md"`

---

## 📋 Estructura de Archivos

```
.cursor/
├── debug-rules.md      # Reglas para el agente de debugging
├── debug-queue.md      # Cola de problemas pendientes
├── dev-workflow.md     # Guía de flujo de trabajo
└── AGENT_WORKFLOW.md   # Este archivo

.cursorrules            # Reglas para el agente de desarrollo
scripts/
└── auto-debug.sh       # Script de verificación automática
```

---

## 🚀 Automatización Avanzada

### Verificación Automática
El script `auto-debug.sh` verifica:
- ✅ Linter (ESLint)
- ✅ Build (Next.js)
- ✅ Tipos de TypeScript

Ejecuta:
```bash
npm run debug:check
```

### Integración con Git Hooks (Opcional)

Puedes agregar un pre-commit hook:
```bash
# .git/hooks/pre-commit
#!/bin/bash
npm run debug:check
```

Esto ejecutará verificaciones antes de cada commit.

---

## 💡 Tips

1. **No mezcles tareas**: Si estás desarrollando, deja el debugging para después
2. **Usa la cola**: Siempre documenta problemas en `debug-queue.md`
3. **Verifica regularmente**: Ejecuta `npm run debug:check` antes de commits importantes
4. **Un problema a la vez**: El agente de debugging resuelve mejor cuando se enfoca

---

## 📝 Ejemplo Completo

### Escenario: Implementar nueva feature

```bash
# Paso 1: Desarrollo
Usuario: "Implementa la feature de reportes mensuales según el plan"
→ Agente de Desarrollo:
  - Lee el plan
  - Implementa la feature
  - Encuentra error de tipo en Prisma
  - Documenta en debug-queue.md:
    "Error: Tipo Decimal no encontrado en Prisma 7"
  - Continúa con siguiente feature

# Paso 2: Debugging
Usuario: "Revisa y resuelve los problemas en debug-queue.md"
→ Agente de Debugging:
  - Lee debug-queue.md
  - Identifica: Prisma 7 cambió el manejo de Decimal
  - Busca todas las ocurrencias de Decimal
  - Corrige: Usa números directamente (Prisma convierte automáticamente)
  - Verifica: npm run build pasa
  - Marca como resuelto en debug-queue.md
```

---

## ❓ Preguntas Frecuentes

**P: ¿Puedo usar ambos agentes al mismo tiempo?**
R: No recomendado. Mejor alternar: desarrollo → debugging → desarrollo

**P: ¿Qué pasa si el agente de debugging no puede resolver algo?**
R: Documenta el problema con más detalle y pide ayuda humana

**P: ¿Puedo personalizar las reglas?**
R: Sí, edita `.cursorrules` y `.cursor/debug-rules.md`
