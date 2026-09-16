# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.1] - 2026-09-15

### Added
- **Menú Lateral Colapsable en Consola Admin:**
  - Botón de alternancia rápida (`ChevronLeft` / `ChevronRight`) en la parte superior del menú lateral.
  - Modo colapsado compacto (72px) que oculta los rótulos y mantiene centrados los iconos de navegación con tooltips nativos.
  - Persistencia automática del estado (colapsado/expandido) en `localStorage` (`nexus_admin_sidebar_collapsed`).
- **Diseño de Tarjetas Responsivas en Mantenimiento de Clientes (`ClientsPage`):**
  - Reemplazo de la estructura rígida de tabla por tarjetas con estilo glassmorphism, eliminando la necesidad de scroll horizontal en monitores pequeños o con escalado de Windows.
  - Grid adaptable (`repeat(auto-fit, minmax(280px, 1fr))`) para credenciales de API Key y orígenes permitidos (CORS).
  - Truncado inteligente con puntos suspensivos (`text-overflow: ellipsis`) para API Keys visibles y botones de alternar/copiar siempre accesibles.

### Changed
- **Optimización del Entorno de Desarrollo (Backend):**
  - Reemplazo de `ts-node-dev` por `nodemon` con `--transpile-only` y `--delay 500ms` en `package.json`, resolviendo interbloqueos (deadlocks) de IPC y liberando hasta 80% de consumo de memoria en Windows.
- **Espaciado y Fluidez en `AdminLayout`:**
  - Reducción del padding del área de contenido principal (`1.5rem 1.75rem`) para maximizar el espacio útil en pantalla.
- **Compatibilidad con Gestores de Contraseñas del Navegador:**
  - En `Button.tsx`, sustitución del atributo nativo `disabled` por `aria-disabled` y `pointer-events-none` durante el estado de carga para permitir que navegadores como Chrome, Edge y Firefox detecten el envío del formulario y ofrezcan guardar credenciales.

### Fixed
- **Corte de Botón "Regenerar Key":**
  - Corrección del desbordamiento y recorte del botón en resoluciones reducidas o displays con escalado DPI en Windows.
- **Resiliencia de Winston Logger en Windows:**
  - Manejador de evento `'error'` en `src/config/logger.ts` para evitar que bloqueos temporales de archivos de log en Windows detengan silenciosamente el proceso.
- **Reintentos ante `EADDRINUSE`:**
  - Manejador del evento `'error'` en el servidor HTTP de `src/index.ts` para reintentar la conexión si el socket tarda en liberarse tras un reinicio rápido.



### Added
- **Panel de Administración Multicliente en Frontend:**
  - Nuevo layout administrativo (`AdminLayout`) con menú lateral, acceso a módulos, indicadores de rol Super Administrador y navegación intuitiva.
  - **Mantenimiento de Clientes (`ClientsPage`):** Visualización de clientes, copia y visualización protegida de API Keys, alta de aplicaciones clientes, regeneración de credenciales con invalidación de anteriores y eliminación.
  - **Dashboard de Estadísticas (`StatisticsPage`):** Métricas consolidadas por cliente con filtros de rango de calendario (día actual, 7 días, 30 días, rango manual), conteo de usuarios registrados, cambios de contraseña, tasa de adopción de MFA/2FA, tasa de éxito en accesos y desglose de tipo de registro (Email/Contraseña vs Social OAuth2).
  - **Logs de Auditoría Multicliente (`LogsPage`):** Visualizador de bitácora con filtro por sistema cliente, buscador predictivo por correo de usuario, filtro por estado (Exitoso/Fallido) y límite de registros.
- **Auditoría de Cambios de Contraseña:**
  - Modelo `PasswordChangeLog` en `prisma/schema.prisma` para registrar IP, User Agent, fecha y cliente en cada cambio de contraseña.
  - Campo `passwordChangedAt` en el modelo `User` para control histórico y soporte a futuro de políticas de expiración.
- **Seguridad Super Administrador:**
  - Middleware `requireSuperAdmin` para validar privilegios en el backend según la variable de entorno `SUPERADMIN_EMAIL`.
  - Inyección del atributo `isSuperAdmin` en el token JWT y en la sesión del frontend.
- **Nuevos Endpoints de Backend:**
  - `POST /clients/:id/regenerate-key`: Rotación y emisión de nuevo API Key.
  - `GET /admin/stats`: Métricas analíticas agregadas con soporte multicliente y rangos de fecha.
  - `GET /admin/logs`: Bitácora de accesos con filtros por cliente, correo y estado.
- **Datos de Prueba y Testing:**
  - Script `npm run seed:demo` (`prisma/seed-demo.ts`) para poblar la base de datos con dos sistemas cliente ficticios, 10 usuarios y 33 registros de log variados.
  - Suite de tests unitarios para autenticación y tokens Super Administrador (`tests/admin.test.ts`).

### Changed
- Las rutas bajo `/clients` ahora requieren privilegios de Super Administrador mediante `requireSuperAdmin`.
- `RecoveryService.resetPassword` ahora actualiza `passwordChangedAt` y genera automáticamente un registro en `PasswordChangeLog`.
- `src/app.ts` monta el enrutador administrativo bajo `/admin`.

### Security
- Aislamiento estricto de endpoints de gestión administrativa (`/admin/*` y `/clients/*`) mediante validación de firma JWT y comparación contra el email de Super Administrador autorizado.

## [1.1.0] - 2026-09-15

### Added
- **Arquitectura Multi-Cliente (Multi-Tenant):** El sistema ahora soporta el registro y gestión de múltiples sistemas clientes.
- Nuevo CRUD de clientes bajo la ruta `/clients` para registrar aplicaciones que consumirán NexusAuth.
- Generación y validación estricta mediante `x-api-key` (o `apiKey` por query) en todas las peticiones de autenticación.

### Changed
- **Seguridad (CORS Dinámico):** Se reemplazó la política de orígenes abiertos (`*`) por una lista blanca (whitelist) estricta a nivel de Base de Datos, interceptando e inspeccionando cabeceras `Origin` de forma independiente por cada cliente.
- El inicio de sesión y registro ahora validan usuarios en el contexto de un cliente específico, permitiendo que un mismo correo exista en múltiples sistemas con contraseñas e historiales separados.
- Los flujos de autenticación social (Google, Facebook, GitHub) han sido adaptados para propagar y respetar el `clientId` usando el parámetro `state` de OAuth.
- La recuperación de contraseña ahora respeta el contexto Multi-Tenant del usuario.

### Fixed
- **Manejo de Errores en Registro:** Corrección en `AuthController.register` donde las excepciones de validación en español (formato de correo, complejidad de contraseña y usuario existente) no eran capturadas como `400 Bad Request` y provocaban error `500 Internal Server Error`.

## [1.0.4] - 2026-03-29

### Added
- Soporte para autenticación social con GitHub mediante OAuth2.
- Lógica de obtención de correo electrónico primario y verificado desde la API de GitHub para usuarios con perfil privado.
- Configuración de variables de entorno para GitHub (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL`).
- Botones de "GitHub" en las interfaces de inicio de sesión y registro en el frontend.

### Fixed
- Corrección de la tipificación del enumerador `Provider` en el cliente de Prisma para incluir `GITHUB`.
- Sincronización de la base de datos PostgreSQL con migraciones específicas para añadir nuevos proveedores sociales sin pérdida de integridad referencial.

## [1.0.2] - 2026-03-28

### Added
- Traducción completa de la interfaz de usuario al español en todas las pantallas (Login, Registro, Recuperación de contraseña, Dashboard, Historial).
- Soporte para variables de entorno para el correo remitente (`RESEND_FROM_EMAIL`).

### Fixed
- Corrección en el envío de correos de recuperación de contraseña: se implementó el remitente `onboarding@resend.dev` por defecto para asegurar la compatibilidad con el modo de prueba de Resend.
- Mejora en el manejo de errores de la API de Resend para capturar y notificar fallos de envío en lugar de fallar silenciosamente.
- Corrección de la URL de recuperación de contraseña para apuntar al puerto correcto del frontend (5173).
- Traducción de todos los mensajes de error y validación del backend al español.

## [1.0.3] - 2026-03-28

### Added
- Rediseño profesional del Dashboard con tarjetas compactas, cuadrícula de información e iconografía moderna.
- Mejora visual de la pantalla de Historial de Inicios de Sesión con un listado vertical compacto (detalles a la izquierda, mapa a la derecha) para optimizar el espacio y reducir el scroll.
- Sistema de tarjetas organizadas para separar la información de perfil de la configuración de seguridad.

### Changed
- Optimización de la altura vertical del Dashboard para minimizar el desplazamiento (scroll) innecesario.
- Mejora de la visibilidad y posición del botón de cerrar sesión (esquina superior derecha, estilo discreto).
- Consistencia visual en los tamaños de tipografía de cabecera (3rem) entre todas las páginas principales.


## [1.0.1] - 2026-03-11

### Fixed
- Corrección en el servicio de autenticación para capturar y almacenar correctamente la IP pública del usuario desde ip-api cuando el login se realiza en un entorno local, permitiendo visualizar la IP correcta en la pantalla de historial de login.

## [1.0.0] - 2026-03-09

### Added
- Autenticación Local con Email y Password usando bcrypt.
- Integración de OAuth2 (Google y Facebook) vía Passport.
- Autenticación de Múltiples Factores (MFA) soportando apps TOTP (Google Authenticator, Authy).
- Backup codes para recuperación de MFA en texto sin conexión y guardado cifrado en la base de datos.
- Proceso de recuperación de contraseña con correos gestionado a través de la API de Resend.
- Historial interactivo de auditoría de inicio de sesión (`LoginLog`), capturando ubicación IP exitosa o fallida.
- Geolocalización de IP usando ip-api.com, guardando las coordenadas geográficas de los inicios de sesión.
- Cliente Frontend React en Vite implementando interfaces de login, setup de MFA e historias de acceso con mapas (Leaflet).
- Estructura de componentes y base de datos con Prisma ORM (modelos de User, OAuthProvider, BackupCode y LoginLog).
