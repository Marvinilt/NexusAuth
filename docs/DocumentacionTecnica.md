# 📘 Documentación Técnica: NexusAuth (v1.2.1)
**Fecha:** 2026-09-15

## 🏗️ Arquitectura del Microservicio Centralizado (Zero-Cost Identity Provider)
* **Poder de Cómputo / API:** Construido sobre Node.js y Express (TypeScript). En desarrollo utiliza `nodemon` con bandera `--transpile-only` y debounce de 500ms para evitar deadlocks de IPC y bloqueos de archivos en Windows.
* **Almacenamiento y Migraciones:** PostgreSQL administrado por Prisma ORM.
* **Componentes Externos (OAuth):** `passport-google-oauth20`, `passport-facebook` y `passport-github2` conectándose a las IDP respectivas con callback urls estandarizadas en desarrollo local. El proveedor GitHub incluye una lógica secundaria de obtención de correos mediante la API de GitHub para perfiles privados.
* **MFA (Zero-Cost TOTP):** Utiliza `otplib` para generar *Time-Based One-Time Passwords* apegados a algoritmos y protocolos IETF HOTP (RFC 4226/6238). Los Secretos MFA (`mfa_secret`) jamás se almacenan localmente en texto claro, sino encriptados (AES-256-GCM) usando Node `crypto` y un Vector de Inicialización dinámico.
* **Notificaciones Outbound (Email):** Implementado vía servicio de entrega `resend` que expone planes sin costo.
* **Consola de Administración Multicliente y UX Responsiva:** 
  * Interfaz en React 18 (Vite + Tailwind) estructurada bajo `AdminLayout` con **menú lateral colapsable** (`260px` a `72px`) persistente en `localStorage`, optimizando el espacio horizontal en monitores pequeños o con escalado DPI.
  * **Mantenimiento de Clientes (`ClientsPage`):** Arquitectura basada en tarjetas fluidas con glassmorphism y CSS Grid dinámico (`repeat(auto-fit, minmax(280px, 1fr))`), eliminando dependencias de tablas rígidas y eliminando por completo el scroll horizontal forzado.
  * **Accesibilidad y Autoguardado de Contraseñas:** Compatibilidad con gestores de contraseñas de navegadores (Chrome, Edge, Firefox) en componentes interactivos (`Button.tsx`) mediante `aria-disabled` y `pointer-events-none`.

## 🧩 Componentes y Comunicación del Sistema

```mermaid
sequenceDiagram
    participant SuperAdmin as Super Administrador
    participant Frontend as Cliente React (Vite)
    participant AuthAPI as API NexusAuth (Express)
    participant OAuth as Social Providers
    participant DB as PostgreSQL
    participant Email as Resend API
    
    SuperAdmin->>Frontend: Accede al Menú Administrativo
    Frontend->>AuthAPI: GET /clients /admin/stats /admin/logs (Bearer JWT)
    AuthAPI->>DB: Consultas y auditoría de clientes
    AuthAPI-->>Frontend: Métricas consolidadas y bitácora
    Frontend->>OAuth: Redirección OAuth (Usuario aprueba)
    OAuth->>AuthAPI: Callback con Token/Perfil
    AuthAPI->>Email: Envío Correos de Recuperación
```

## 🔐 Flujo de Autenticación MFA (Doble Factor)

```mermaid
sequenceDiagram
    participant User as Usuario
    participant Frontend
    participant Backend
    participant AuthApp as Authenticator App
    
    User->>Frontend: Ingresa Email y Password
    Frontend->>Backend: POST /auth/login
    Backend-->>Frontend: 200 OK { mfaRequired: true, mfaToken: "jwt-temp" }
    Frontend-->>User: Muestra pantalla: "Ingrese su código 2FA"
    User->>AuthApp: Revisa el token generado de 6 dígitos
    AuthApp-->>User: Visualiza 123456
    User->>Frontend: Escribe 123456 y envía
    Frontend->>Backend: POST /mfa/verify-login (Auth Bearer: jwt-temp, body: token)
    Backend->>Backend: Descifra el mfaSecret, valida el token con ventana de +-60 segs
    Backend-->>Frontend: 200 OK / Emite JWT Full Session de 15mins
    Frontend-->>User: Acceso Permitido, redirección al Dashboard
```

## 🌐 Endpoints Principales Disponibles

### 🔑 Authentication (Local + MFA Lifecycle)
> **Requisito de Multi-Tenancy:** Todos los endpoints de autenticación requieren que se identifique el sistema cliente que origina la petición, ya sea a través del header `x-api-key` o el parámetro de consulta `apiKey`.

* **`POST /auth/register`**: Recibe `{ email, password }` e identifica el cliente. Otorga password hashing y validaciones de complejidad. Si el correo existe para este cliente, arroja error 400.
* **`POST /auth/login`**: Crea el payload JWT. Compara hashes `bcrypt`. Retorna objeto `{ mfaRequired: true, mfaToken: ... }` si el usuario habilitó Two-Factor o un Session-JWT completo. Si el email coincide con `SUPERADMIN_EMAIL`, incluye `isSuperAdmin: true`.
* **`POST /mfa/setup`**: Validado mediante Bearer Token. Retorna secret key en crudo + base64 data url enlazando un URI `otpauth://` lista para escanear en apps.
* **`POST /mfa/verify-setup`**: Habilita oficialmente la capa de seguridad adicional y retorna un array pregenerado de 10 llaves de seguridad Offline (Backup Codes) alocados en PostgreSQL.
* **`POST /mfa/verify-login`**: Requiere payload "auth pending" en headers JWT Auth. Acepta `{ token: XXXXXX }` el cual es verificado. Da tokens totales.
* **`GET /auth/history`**: Requiere Bearer Token. Retorna los últimos 5 intentos de inicio de sesión (Exitosos y Fallidos) incluyendo metadata de red y ubicación del usuario actual.

### 🏢 Clients (Mantenimiento de Sistemas Cliente - Requiere SuperAdmin)
* **`POST /clients`**: Crea un nuevo sistema cliente. Recibe `{ name, allowedOrigins }` y devuelve un `apiKey`.
* **`GET /clients`**: Lista todos los sistemas clientes registrados con sus respectivos orígenes permitidos.
* **`POST /clients/:id/regenerate-key`**: Invalida el API Key actual del cliente y genera uno nuevo de forma atómica.
* **`DELETE /clients/:id`**: Elimina permanentemente un sistema cliente y, en cascada, todos sus usuarios y registros asociados.

### 📊 Admin Analytics & Logs Multicliente (Requiere SuperAdmin)
* **`GET /admin/stats`**: Obtiene métricas analíticas. Parámetros opcionales: `clientId` (o 'all'), `range` ('today', '7d', '30d', 'custom'), `from` y `to`. Devuelve total de usuarios, altas en período, cambios de contraseña, tasa de adopción de MFA, distribución de tipo de registro (Email vs Social) y tasa de éxito de inicios de sesión.
* **`GET /admin/logs`**: Bitácora de accesos multicliente. Parámetros opcionales: `clientId`, `email` (búsqueda parcial insensible a mayúsculas), `status` ('SUCCESS' o 'FAILED'), y `limit` (por defecto 100).

### 🌍 Social Providers (OAuth2 Auth Code Flow)
* **`GET /auth/google`**: Init OAuth window.
* **`GET /auth/facebook`**: Init OAuth window.
* **`GET /auth/github`**: Init OAuth window (Solicita scope `user:email`).
* **Callbacks asociados:** `/auth/google/callback`, `/auth/facebook/callback` y `/auth/github/callback` respectivamente. Valida o crea un IDP en esquema Prisma `OAuthProvider`. Termina con `oauthCallback` arrojando un JWT válido. En el caso de GitHub, si el email no es público, se realiza una petición interna asíncrona a `api.github.com/user/emails`.

### 🔄 Recovery
* **`POST /recovery/forgot-password`**: Se consume con un `{ email }`. Dispara `resend.emails.send()`.
* **`POST /recovery/reset-password`**: Cambia la contraseña del usuario utilizando el token JWT temporal. Actualiza `passwordChangedAt` en `User` y genera una entrada en `PasswordChangeLog` con la IP y User Agent del cliente.

## 🗄️ Diseño de Base de Datos

Las tablas en el esquema de PostgreSQL administrado con Prisma incluyen las siguientes entidades clave:

```mermaid
erDiagram
    clients ||--o{ users : "aloja"
    clients ||--o{ login_logs : "audita accesos en"
    clients ||--o{ password_change_logs : "audita cambios en"
    users ||--o{ oauth_providers : "autentica vía"
    users ||--o{ backup_codes : "posee"
    users ||--o{ login_logs : "registra acceso en"
    users ||--o{ password_change_logs : "registra cambio de clave en"

    clients {
        String id PK
        String name
        String apiKey UK
        String[] allowedOrigins
        DateTime createdAt
        DateTime updatedAt
    }

    users {
        String id PK
        String email
        String passwordHash
        DateTime passwordChangedAt
        Boolean mfaEnabled
        String mfaSecret
        String clientId FK
        DateTime createdAt
        DateTime updatedAt
    }

    oauth_providers {
        String id PK
        enum provider
        String providerId
        String userId FK
        DateTime createdAt
    }

    backup_codes {
        String id PK
        String codeHash
        Boolean used
        String userId FK
        DateTime createdAt
    }

    login_logs {
        String id PK
        enum status
        String ipAddress
        String userAgent
        String location
        Float latitude
        Float longitude
        String userId FK
        String clientId FK
        DateTime createdAt
    }

    password_change_logs {
        String id PK
        String userId FK
        String clientId FK
        String ipAddress
        String userAgent
        DateTime createdAt
    }
```


1. **`User` (Usuarios):** Almacena el identificador universal, correo (único), *hash* del password (si aplica configuración local), secretos para MFA encriptados y banderas de configuración como `mfaEnabled` o cuentas verificadas.
2. **`OAuthProvider` (Integraciones Sociales):**  Provee Relación de 1 a muchos (1 usuario a muchas plataformas). Se asocia al `User` a través del `userId`, almacenando de dónde provino la cuenta externa (ej. GOOGLE, FACEBOOK, GITHUB) y el ID externo para login social continuo sin colisiones.
3. **`BackupCode` (Códigos de Recuperación MFA):** Una lista ligada al `User`. Códigos generados en texto plano durante la configuración del MFA para recuperar cuentas en caso de pérdida de un smartphone. Son *consumibles*, una vez utilizados se borran atómicamente del registro base.
4. **`LoginLog` (Bitácora de Eventos):** Registra cada intento de autenticación individual, asistiéndose mediante validaciones tanto correctas como incorrectas (`SUCCESS` / `FAILED`). Contiene fecha exacta, dirección IP y metadatos complementarios como Agente de Usuario y geolocalización extraída (`latitude`, `longitude`, `location`).

## 📊 Observabilidad y Seguimiento (Audit Logs)

* **Bitácora de Accesos (`LoginLog`)**: El sistema registra cada intento de inicio de sesión (Local, OAuth y MFA).
  * **Estado**: Clasifica intentos como `SUCCESS` o `FAILED` (contraseña incorrecta, token MFA inválido).
  * **Geolocalización**: Mediante la IP del cliente y la integración con `ip-api.com` (con soporte para resolver localhost al IP del servidor como fallback de dev), se extrae la ciudad, país y coordenadas geográficas.
  * **Visualización Interactiva**: Se dispone de una pantalla exclusiva (`/login-history`) en el frontend que integra tarjetas individuales y mapas en miniatura (`react-leaflet`). Se incluyó un modal para ampliar dicho mapa por evento, para que el usuario identifique fácil e interactivamente accesos no autorizados.
* **Logging de Servidor**: Usando `winston`, logs asíncronos en consola estandarizados marcan timestamps en eventos críticos tales como `AUTH_INVALID_TOTP` ó `USER_MFA_ACTIVATED`. 

## 🛡️ CORS Dinámico y Multi-Tenancy

Para salvaguardar la arquitectura de múltiples clientes, NexusAuth no utiliza un CORS abierto. 
En cambio, emplea una **validación en dos capas**:
1. **Capa HTTP (Preflight)**: El middleware de `cors` consulta la base de datos en tiempo real. Solo si el `Origin` solicitante está en la lista blanca de *algún* cliente de la plataforma, la conexión se permite. Las llamadas Server-to-Server sin cabecera de Origin también son permitidas en esta capa.
2. **Capa Lógica (Middleware de Auth)**: Incluso superando la capa de red HTTP, el `clientAuthMiddleware` verifica que el `Origin` pertenezca específicamente a la lista `allowedOrigins` del cliente exacto del que se proveyó la llave (`x-api-key`).

## 🚀 Guía de Migración de Base de Datos (Nuevo Entorno)

Al trasladar el entorno de desarrollo local o llevar a producción la API de NexusAuth en un servidor Linux/Windows donde exista una instalación nativa de PostgreSQL operando en una URL diferente, debes seguir los siguientes pasos:

1. **Clonar e inicializar ambiente básico**:
   * Transfiere tu código (via `git clone` o equivalente).
   * Crea y modifica el archivo `.env` configurando tu `DATABASE_URL` exclusiva a este ambiente (Asegúrate de cambiar usuario, password y nombre base: e.g., `postgresql://<usuario>:<contrasena>@localhost:5432/nuevaDB_NexusAuth?schema=public`).

2. **Instalar Dependencias de Node:**
   * En el backend y raiz, ejecuta `npm install`.

3. **Generar Cliente Relacional de Prisma:**
   * Prisma debe alocarse basado en el entorno nativo binario de tu SO. Ejecuta en terminal:
   ```bash
   npx prisma generate
   ```

4. **Desplegar la estructura o esquemas al Servidor SQL (Pushing):**
   * **Opción A (Recomendada DevOps):** Levanta las migraciones nativas para replicar la estructura exacta existente:
     ```bash
     npx prisma migrate deploy
     ```
   * **Opción B (Ambientes rápidos e inestables que continúan desarrollándose):** Empuja tu esquema actual directo al DB omitiendo logs de migración.
     ```bash
     npx prisma db push
     ```

5. **Configuración Final**: Ejecuta tu app normalmente con `npm run dev` o compila tu pipeline de producción `npm run build && npm start`. El backend NexusAuth generará las tablas requeridas que no existan si usaste el método correcto y aceptará conexiones enseguida.
