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

### Al Iniciar nuevos cambios, un nuevo feature, o nuevas correcciones

1. Si ya estas en una rama feature, continua ahí haciendo los cambios en ese branch, no crees ningun otro branch.
2. Si NO estas en una rama feature, crea en git un nuevo branch del feature correspondiente a partir del branch develop para iniciar el desarrollo de la nueva funcionalidad.
3. Nunca hagas cambios ni hagas commit sobre el branch develop, tampoco en el branch main, prohibido hacer commit en branch develop o main.
4. Despues de hacer bastantes cambios pregunta al usuario si desea dar por finalizado el desarrollo.


### Al Finalizar el desarrollo de una funcionalidad

Solo si el usuario indica que ha finalizado el desarrollo, realiza las siguientes acciones obligatorias:

    1. Actualiza `Changelog.md` con la nueva funcionalidad desarrollada (fecha y descripción detallada del desarrollo realizado), en orden cronológico inverso. No mezcles todo, agrupa los cambios bajo estos encabezados estándar:
          * Added: Para funciones nuevas.
          * Changed: Para cambios en funciones existentes.
          * Deprecated: Para funciones que se eliminarán en versiones futuras.
          * Removed: Para funciones eliminadas.
          * Fixed: Para cualquier corrección de errores (Bug fixes).
          * Security: En caso de vulnerabilidades.
    
    2. Actualiza `README.md` con la nueva funcionalidad desarrollada (instrucciones, fecha y descripción de feature).
    3. Actualiza `docs/DocumentacionTecnica.md` con la nueva funcionalidad desarrollada (arquitectura, diagrama de arquitectura, diagrama de comunicación entre componentes, documentación de endpoints, diseño, librerias utilizadas, requisitos técnicos, etc.)
    4. Asegúrate de crear o actualizar los Tests Unitarios correspondientes y verifica que pasen exitosamente (`npm test`).
    5. Asegurate de estar en una rama feature antes de realizar un commit.
    6. Nunca hagas cambios ni hagas commit sobre el branch develop, tampoco en el branch main, prohibido hacer commit en branch develop o main.
    7. Si estas en una rama feature realiza el commit de todos los cambios con una descripción detallada del desarrollo y has push al feature branch.
    8. Crea un Pull Request del feature branch hacia `develop` con título `feat(<scope>): <descripción>`.

## 3. Reglas de desarrollo  

1. **Documentación de Código:** Todos los métodos, funciones y clases deben contar con documentación (JSDoc, Docstrings) que explique su propósito, parámetros y valores de retorno.
2. **Nombramiento Descriptivo:** Utilizar nombres de variables, funciones y clases que sean claros y auto-explicativos, evitando abreviaturas ambiguas.
3. **Comentarios de Lógica:** Incluir comentarios breves que expliquen el razonamiento detrás de bloques de código complejos o decisiones técnicas específicas.
4. **Responsabilidad Única:** Cada función o clase debe tener una única responsabilidad clara para facilitar el mantenimiento y las pruebas.
5. **Manejo de Errores:** Implementar validaciones y manejo de excepciones de forma proactiva para asegurar la robustez del sistema.
6. **Limpieza de Código:** Eliminar código muerto, logs de depuración (console.log, print) y comentarios obsoletos antes de realizar un commit.
7. **Tipado Estricto (TypeScript):** Prohibido el uso de `any`. Se deben definir interfaces o tipos explícitos para todas las estructuras de datos.
8. **Consistencia de Dependencias:** No instalar nuevas librerías de terceros sin aprobación explícita. Priorizar el uso de las herramientas ya instaladas en el stack.

## 4. Estándares de Calidad y Testing

1. **Cobertura:** Todo nuevo feature de lógica de negocio o utilidad debe incluir su correspondiente test unitario (usando Vitest para frontend o Jest para backend).
2. **Happy & Sad Paths:** Los tests deben cubrir tanto el caso de éxito como los casos de error/borde.
3. **No regresión:** Antes de solicitar el merge, se deben ejecutar todos los tests existentes para asegurar que no se ha roto funcionalidad previa.

## 5. Seguridad y Performance

1. **Secretos:** Nunca incluir contraseñas, tokens o claves API directamente en el código. Usar variables de entorno (`.env`).
2. **Sanitización:** Validar y sanitizar todas las entradas de datos en el Backend antes de procesarlas.
3. **Optimización:** Evitar bucles anidados innecesarios y renderizados excesivos en React (usar `useMemo`, `useCallback` solo cuando sea necesario).

## 6. Guías de Frontend (React + Tailwind)

1. **Componentes:** Priorizar componentes funcionales y el uso de Hooks.
2. **Estilos:** Utilizar clases de utilidad de **Tailwind CSS**. Evitar crear archivos CSS/SASS separados a menos que sea estrictamente necesario para animaciones complejas.
3. **Semántica y Eficiencia:** Usar elementos HTML estándar (`<button>`, `<input>`) en lugar de `divs` genéricos para las interacciones. Esto mejora la mantenibilidad del código y permite el uso del teclado (Tab/Enter) sin necesidad de programación adicional.