# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
