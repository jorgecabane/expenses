# 🤖 Cómo Usar el Sistema de Agentes

## ❓ Pregunta Frecuente: ¿Necesito otro agente?

**Respuesta corta**: NO. Es el mismo agente (yo) con diferentes "modos" según el prompt que uses.

## 🎯 Cómo Funciona

El sistema funciona con **prompts especializados**. Cuando me das un prompt específico, cambio mi "modo" de trabajo:

### Modo Desarrollo 👨‍💻
Cuando me dices:
```
"Implementa [feature] según el plan. Si encuentras errores que no puedes resolver, 
documenta el problema en .cursor/debug-queue.md"
```

**Qué hago**:
- Me enfoco en implementar features
- Sigo las reglas en `.cursorrules`
- Si encuentro errores, los documento y continúo
- No me detengo a resolver bugs profundos

### Modo Debugging 🐛
Cuando me dices:
```
"Revisa .cursor/debug-queue.md y resuelve todos los problemas pendientes. 
Sigue las reglas en .cursor/debug-rules.md"
```

**Qué hago**:
- Me enfoco en resolver errores
- Sigo las reglas en `.cursor/debug-rules.md`
- Busco la causa raíz de cada problema
- Verifico que las soluciones funcionen

## 📋 Flujo de Trabajo Práctico

### Opción 1: Manual (Recomendado para empezar)

1. **Desarrollo**:
   ```
   "Implementa la feature X. Si hay errores, documenta en debug-queue.md"
   ```

2. **Verificación**:
   ```bash
   npm run debug:check  # Verifica errores automáticamente
   ```

3. **Debugging**:
   ```
   "Revisa debug-queue.md y resuelve todos los problemas"
   ```

### Opción 2: Automatizado (Avanzado)

Puedes crear un script que:
1. Ejecuta `npm run debug:check`
2. Si hay errores, me pide que los resuelva
3. Repite hasta que no haya errores

## 🔄 Ejemplo Real

### Paso 1: Desarrollo
```
Tú: "Implementa la feature de reportes mensuales"

Yo (modo desarrollo):
- Implemento la feature
- Encuentra error: "Decimal no existe en Prisma 7"
- Lo documenta en debug-queue.md
- Continúa con siguiente feature
```

### Paso 2: Debugging
```
Tú: "Revisa debug-queue.md y resuelve los problemas"

Yo (modo debugging):
- Lee debug-queue.md
- Identifica: Prisma 7 cambió el manejo de Decimal
- Busca todas las ocurrencias
- Corrige: Usa números directamente
- Verifica: npm run build pasa
- Marca como resuelto
```

## 🚀 Automatización Avanzada

### Script de Verificación Automática

Ya está creado: `scripts/auto-debug.sh`

**Qué hace**:
- ✅ Verifica linter
- ✅ Verifica build
- ✅ Verifica tipos TypeScript
- ✅ Verifica que las páginas funcionen (GET requests)
- ✅ Agrega errores a `debug-queue.md`

**Cómo usarlo**:
```bash
npm run debug:check
```

### Verificación de Páginas

Nuevo: `scripts/verify-pages.sh`

**Qué hace**:
- ✅ Hace GET requests a todas las rutas
- ✅ Verifica que no den 404
- ✅ Reporta errores

**Cómo usarlo**:
```bash
npm run debug:pages
# O con URL personalizada:
BASE_URL=http://localhost:3000 npm run debug:pages
```

## 💡 Tips

1. **Alterna modos**: No mezcles desarrollo y debugging en la misma conversación
2. **Usa la cola**: Siempre documenta problemas en `debug-queue.md`
3. **Verifica regularmente**: Ejecuta `npm run debug:check` antes de commits
4. **Un problema a la vez**: En modo debugging, me enfoco mejor

## 🎓 Resumen

- **NO necesitas otro agente**: Soy yo con diferentes prompts
- **Usa prompts específicos**: Menciona `.cursorrules` o `debug-rules.md`
- **Automatiza verificación**: Usa `npm run debug:check`
- **Documenta problemas**: Usa `debug-queue.md`

## 📝 Prompts Listos para Copiar

### Desarrollo
```
Implementa [feature] según el plan. Si encuentras errores que no puedes resolver, 
documenta el problema en .cursor/debug-queue.md y continúa con la siguiente tarea.
```

### Debugging
```
Revisa .cursor/debug-queue.md y resuelve todos los problemas pendientes. 
Sigue las reglas en .cursor/debug-rules.md.
```

### Verificación Completa
```
1. Ejecuta npm run debug:check
2. Revisa .cursor/debug-queue.md
3. Resuelve todos los problemas pendientes
4. Verifica que todo funciona
```
