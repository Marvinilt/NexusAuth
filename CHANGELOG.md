# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
