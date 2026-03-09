# Documentación Técnica: NexusAuth (v1.0.0)

**Fecha:** 2026-03-08

## Arquitectura del Microservicio Centralizado (Zero-Cost Identity Provider)
* **Poder de Cómputo / API:** Construido sobre Node.js y Express (TypeScript).
* **Almacenamiento y Migraciones:** PostgreSQL administrado por Prisma ORM.
* **Componentes Externos (OAuth):** `passport-google-oauth20` y `passport-facebook` conectándose a las IDP respectivas con callback urls estandarizadas en desarrollo local.
* **TOTP MFA:** Utiliza `otplib` para generar *Time-Based One-Time Passwords* apegados a algoritmos y protocolos IETF HOTP (RFC 4226/6238). Los Secretos MFA (`mfa_secret`) jamás se almacenan localmente en texto claro, sino encriptados (AES-256-GCM) usando Node `crypto` y un Vector de Inicialización dinámico.
* **Notificaciones Outbound (Email):** Implementado vía servicio de entrega `resend` que expone planes sin costo.

## Endpoints Principales Disponibles

### Authentication (Local + MFA Lifecycle)
* **`POST /auth/register`**: Recibe `{ email, password }`. Otorga password hashing y validaciones de complejidad. Si el correo existe arroja error 400.
* **`POST /auth/login`**: Crea el payload JWT (Session Lifecycle 15 mins). Compara hashes `bcrypt`. Retorna objeto `{ mfaRequired: true, mfaToken: ... }` si el usuario habilitó Two-Factor o un Session-JWT completo.
* **`POST /mfa/setup`**: Validado mediante Bearer Token. Retorna secret key en crudo + base64 data url enlazando un URI `otpauth://` lista para escanear en apps como Google Authenticator.
* **`POST /mfa/verify-setup`**: Habilita oficialmente la capa de seguridad adicional y retorna un array pregenerado de 10 llaves de seguridad Offline (Backup Codes) alocados en PostgreSQL.
* **`POST /mfa/verify-login`**: Requiere payload "auth pending" en headers JWT Auth. Acepta `{ token: XXXXXX }` el cual es verificado considerando el "±30 second drift rule". Da tokens totales.

### Social Providers (OAuth2 Auth Code Flow)
* **`GET /auth/google`**: Init OAuth window.
* **`GET /auth/facebook`**: Init OAuth window.
* **Callbacks asociados:** `/auth/google/callback` y `/facebook/callback` respectivamente. Valida o crea un IDP en esquema Prisma `OAuthProvider`. Termina con `oauthCallback` arrojando un JWT válido.

### Recovery
* **`POST /recovery/forgot-password`**: Se consume con un `{ email }`. Dispara `resend.emails.send()`.
* **`POST /recovery/reset-password`**: Cambia el secret password de un usuario sin sesión consumiendo el Short-Lived JWT proveido durante la recuperación por email.

## Diseño de Base de Datos
- Las tablas en PostgreSQL con prisma proveen Relación uno-a-muchos. 1 `User` tiene múltiples llaves de Login social (`OAuthProvider`).
- Las llaves MFA recovery codes (`BackupCode`) son mapeadas y borradas atómicamente al reiniciarse el flujo MFA.

## Observabilidad
- Usando `winston`, logs asíncronos en consola estandarizados marcan timestamps en eventos críticos tales como `AUTH_INVALID_TOTP` ó `USER_MFA_ACTIVATED`. 
