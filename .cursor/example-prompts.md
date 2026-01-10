# 📝 Ejemplos de Prompts para Agentes

## 👨‍💻 Prompts para Agente de Desarrollo

### Implementar una feature completa
```
Implementa la feature de [nombre] según el plan en [ruta del plan]. 
Sigue las reglas en .cursorrules. Si encuentras errores que no puedes resolver, 
documenta el problema en .cursor/debug-queue.md y continúa con la siguiente tarea.
```

### Implementar múltiples features
```
Implementa las siguientes features del plan:
1. [Feature 1]
2. [Feature 2]
3. [Feature 3]

Sigue las reglas en .cursorrules. Si encuentras errores, documenta en 
.cursor/debug-queue.md y continúa.
```

### Refactorizar código
```
Refactoriza [archivo/componente] para mejorar [aspecto específico]. 
Mantén la funcionalidad existente. Si encuentras problemas, documenta en 
.cursor/debug-queue.md.
```

---

## 🐛 Prompts para Agente de Debugging

### Resolver todos los problemas pendientes
```
Revisa .cursor/debug-queue.md y resuelve todos los problemas pendientes. 
Sigue las reglas en .cursor/debug-rules.md. Marca cada problema como resuelto 
cuando termines.
```

### Resolver un problema específico
```
Resuelve el problema "[título]" en .cursor/debug-queue.md. 
Sigue las reglas en .cursor/debug-rules.md y verifica que la solución funciona.
```

### Debugging de un error específico
```
Tengo este error: [pegar error completo]

Identifica la causa raíz y resuélvelo. Sigue las reglas en .cursor/debug-rules.md.
```

### Verificar y corregir errores de compilación
```
Ejecuta npm run debug:check y resuelve todos los errores encontrados. 
Sigue las reglas en .cursor/debug-rules.md.
```

---

## 🔄 Prompts para Flujo Completo

### Desarrollo + Debugging
```
1. Implementa [feature] según el plan
2. Si hay errores, documenta en .cursor/debug-queue.md
3. Luego resuelve todos los problemas en debug-queue.md
```

### Verificación completa
```
1. Ejecuta npm run debug:check
2. Revisa .cursor/debug-queue.md
3. Resuelve todos los problemas pendientes
4. Verifica que todo funciona correctamente
```

---

## 📋 Prompts de Mantenimiento

### Actualizar documentación
```
Actualiza la documentación para reflejar los cambios recientes en [feature/archivo]. 
Asegúrate de que esté actualizada y sea clara.
```

### Revisar código
```
Revisa el código en [ruta] y sugiere mejoras de:
- Legibilidad
- Performance
- Mantenibilidad
- Seguridad
```

### Limpiar código
```
Limpia el código en [ruta]:
- Elimina código comentado
- Elimina imports no usados
- Simplifica lógica compleja
- Mejora nombres de variables
```

---

## 🎯 Prompts Específicos para Este Proyecto

### Agregar nueva categoría de bolsillo
```
Agrega una nueva categoría de bolsillo predeterminada: [nombre]. 
Debe incluir:
- Icono apropiado
- Color de marca
- Descripción
- Agregarlo a la lista de bolsillos predeterminados
```

### Mejorar dashboard
```
Mejora el dashboard principal para mostrar:
- [Métrica 1]
- [Métrica 2]
- [Visualización]

Sigue el diseño de marca establecido.
```

### Agregar notificación
```
Implementa notificaciones para [evento] usando Resend. 
Debe incluir:
- Template de email
- Lógica de envío
- Configuración de triggers
```

---

## 💡 Tips para Escribir Prompts Efectivos

1. **Sé específico**: Menciona archivos, funciones, o features específicas
2. **Proporciona contexto**: Incluye información relevante del plan o errores
3. **Define el alcance**: Especifica qué debe hacer y qué no
4. **Menciona las reglas**: Siempre referencia `.cursorrules` o `debug-rules.md`
5. **Pide documentación**: Si es necesario, pide que documente decisiones

---

## 🔗 Referencias Rápidas

- **Reglas de desarrollo**: `.cursorrules`
- **Reglas de debugging**: `.cursor/debug-rules.md`
- **Cola de debugging**: `.cursor/debug-queue.md`
- **Flujo de trabajo**: `.cursor/dev-workflow.md`
- **Este archivo**: `.cursor/example-prompts.md`
