---
trigger: always_on
---

# Reglas Globales del Sistema y Flujo de Desarrollo (Antigravity)

## 1. Metodología de Branches (GitFlow)
- `main` es intocable (Producción).
- `develop` es la rama de integración.
- Todo desarrollo inicia creando una rama desde `develop` llamada `feature/<descripcion-corta-en-kebab-case>`.
- Todos los cambios se integran a `develop` por medio de Pull Requests. No se debe realizar merge directo.

## 2. Flujo de Desarrollo (Developer Workflow)

### Al Iniciar el desarrollo de una nueva implementación
1. Si esta iniciando todo un desarrollo nuevo de una implementación de nueva funcionalidad, primero verificar que la rama actual sea develop y que este actualizada.
2. Luego crea la rama de feature correspondiente para el desarrollo actual.
3. Inicia el desarrollo de la funcionalidad.

### Al Finalizar el desarrollo de una funcionalidad
1. Cuando el usuario indique que ha finalizado el desarrollo realiza estas acciones:
    a. Actualiza `README.md` (instrucciones, fecha y descripción de feature).
    b. Actualiza `docs/DocumentacionTecnica.md` (arquitectura, endpoints, diseño, fecha).
    c. Realiza el commit de todos los cambios con una descripción detallada del desarrollo y has push al feature branch.
    d. Crea un Pull Request del feature branch hacia `develop` con título `feat(<scope>): <descripción>`.

## 3. Reglas de desarrollo  
1. **Documentación de Código:** Todos los métodos, funciones y clases deben contar con documentación (JSDoc, Docstrings) que explique su propósito, parámetros y valores de retorno.
2. **Nombramiento Descriptivo:** Utilizar nombres de variables, funciones y clases que sean claros y auto-explicativos, evitando abreviaturas ambiguas.
3. **Comentarios de Lógica:** Incluir comentarios breves que expliquen el razonamiento detrás de bloques de código complejos o decisiones técnicas específicas.
4. **Responsabilidad Única:** Cada función o clase debe tener una única responsabilidad clara para facilitar el mantenimiento y las pruebas.
5. **Manejo de Errores:** Implementar validaciones y manejo de excepciones de forma proactiva para asegurar la robustez del sistema.
6. **Limpieza de Código:** Eliminar código muerto, logs de depuración (console.log, print) y comentarios obsoletos antes de realizar un commit.