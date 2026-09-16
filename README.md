# 🛡️ NexusAuth

![Version](https://img.shields.io/badge/version-1.3.0-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18.0-61DAFB?logo=react&logoColor=black)

**NexusAuth** es un microservicio de Identidad Centralizada (*Identity Provider*) de arquitectura abierta y costo cero (*Zero-Cost*), diseñado para gestionar autenticación segura, control de acceso multicliente y auditoría en tiempo real.

---

## 🚀 Funcionalidades Principales

* **Autenticación Flexible y Multicanal:** Login tradicional (Email/Contraseña cifrado con Bcrypt y JWT) e integración social vía OAuth2 (Google, GitHub y Facebook).
* **Seguridad Avanzada y MFA (2FA):** Doble factor de autenticación TOTP (Google Authenticator / Authy con secretos cifrados en AES-256-GCM), códigos de respaldo y recuperación de contraseña vía correo electrónico.
* **Arquitectura Multicliente (Multi-Tenant):** Aislamiento y conexión de múltiples aplicaciones cliente a través de `API Keys` y listas blancas CORS independientes.
* **Consola de Super Administrador:** Panel de control web completo para la administración del ecosistema:
  * **Gestión de Clientes:** Mantenimiento de aplicaciones conectadas y rotación de credenciales.
  * **Directorio de Usuarios:** Búsqueda en tiempo real, auditoría de cuentas y reinicio remoto de MFA para recuperación de acceso.
  * **Analítica en Tiempo Real:** Métricas de adopción de 2FA, tipos de registro y tasas de éxito en accesos por cliente y rangos de fecha.
  * **Auditoría con Mapas Interactivos:** Bitácora de accesos con geolocalización IP representada en mapas interactivos Leaflet / OpenStreetMap.

---

## 📸 Capturas de Pantalla

### Inicio de Sesión
![Pantalla de Inicio de Sesión](docs/screenshots/login.png)

### Consola Administrativa — Mantenimiento de Clientes
![Consola Administrativa - Clientes](docs/screenshots/admin_dashboard.png)

### Directorio de Usuarios y Reinicio de MFA
![Directorio de Usuarios](docs/screenshots/admin_users.png)

### Métricas y Analítica del Sistema
![Estadísticas del Sistema](docs/screenshots/admin_stats.png)

---

## 🛠️ Stack Tecnológico

**Backend:**
* Node.js & Express
* TypeScript
* Prisma ORM
* PostgreSQL
* Passport.js (OAuth2)
* JSON Web Tokens (JWT) & Bcrypt
* Resend API (Emails)

**Frontend:**
* React (Vite)
* Tailwind CSS
* React Router v6
* React Leaflet (Mapas)
* Lucide React (Íconos)

## ⚙️ Requisitos de Entorno (`.env`)

Necesitarás configurar las variables de entorno principales. Copia y modifica `.env.example` en un nuevo archivo llamado `.env` en el directorio raíz.

```env
# URL de la base de datos PostgreSQL
DATABASE_URL="postgresql://usuario:password@localhost:5432/nexusauth?schema=public"

# Super Administrador (acceso al panel multicliente)
SUPERADMIN_EMAIL="admin@nexusauth.com"

# Llave maestra para firmas y cifrados (JWT, Encripción MFA)
JWT_SECRET="tusecreoaqui_minimo_32_caracteres"
ENCRYPTION_KEY="llave_de_32_bytes_para_aes_256"

# Credenciales de Email (Resend)
RESEND_API_KEY="re_..."
EMAIL_FROM="NexusAuth <onboarding@resend.dev>"
FRONTEND_URL="http://localhost:5173"

# Credenciales Sociales (OAuth)
GOOGLE_CLIENT_ID="...apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="..."
GOOGLE_CALLBACK_URL="http://localhost:3000/auth/google/callback"
FACEBOOK_APP_ID="..."
FACEBOOK_APP_SECRET="..."
FACEBOOK_CALLBACK_URL="http://localhost:3000/auth/facebook/callback"

# Credenciales GitHub (GitHub OAuth)
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."
GITHUB_CALLBACK_URL="http://localhost:3000/auth/github/callback"
```

## 📦 Guía de Instalación

1. Clona el repositorio e instala las librerías:
   ```bash
   git clone <repo-url>
   cd NexusAuth
   npm install
   ```
2. Inicializa las tablas de la base de datos a través de Prisma:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
3. (Opcional) Genera datos ficticios multicliente para pruebas de clientes, estadísticas y logs:
   ```bash
   npm run seed:demo
   ```

## ⚡ Guía de Uso Rápido

Para iniciar el ambiente en modo de desarrollo:

**Terminal Backend:**
```bash
npm run dev
```
Levantará el servidor API REST por defecto en `http://localhost:3000`.

**Terminal Frontend:**
```bash
cd frontend
npm install
npm run dev
```
Levantará el cliente React interactivo por defecto en `http://localhost:5173`.

## 🤝 Cómo Contribuir

1. Asegúrate de estar en la rama `develop`.
2. Crea una rama de funcionalidad desde `develop`: `git checkout -b feature/<descripcion-corta-en-kebab-case>`.
3. Trabaja en tus cambios y confirma aplicando el estándar Conventional Commits.
4. Actualiza `README.md`, `CHANGELOG.md` y `docs/DocumentacionTecnica.md` según aplique de acuerdo a la funcionalidad nueva.
5. abre un Pull Request dirigido a la rama `develop`.

## 📚 Referencias de Documentación

* [Documentación Técnica (Arquitectura y Endpoints)](./docs/DocumentacionTecnica.md)
* [Historial de Cambios (Changelog)](./CHANGELOG.md)

## 📄 Licencia y Autor

Este proyecto se encuentra licenciado bajo los términos de la licencia **MIT**.

**Autor:** NexusAuth Team
