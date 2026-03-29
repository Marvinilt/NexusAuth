# 🛡️ NexusAuth

![Version](https://img.shields.io/badge/version-1.0.2-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18.0-61DAFB?logo=react&logoColor=black)

NexusAuth es un microservicio de Identidad Centralizada "Zero-Cost" construido con Node.js, Express y Prisma. Su objetivo principal es proveer opciones robustas de autenticación con componentes Open Source o de capa gratuita (Zero-Cost).

## 🚀 Descripción Funcional

El sistema soporta autenticación multicanal y multifactor, e incluye las siguientes características principales integradas en un solo microservicio con cliente web frontend en React:

* **Login Local:** Autenticación con Email/Password, encripción con Bcrypt y JWT.
* **Integración Social (OAuth2):** Soporte para Google y Facebook. 
* **MFA (Zero-Cost TOTP):** App Authenticator (Google Authenticator / Authy) con códigos de recuperación. Secretos cifrados con AES-256-GCM.
* **Account Recovery:** Enlaces de reseteo de contraseña enviados por correo vía Resend. Expiración de 15 minutos en los tokens.
* **Monitoreo de Auditoría:** Histórico de accesos de sesión (exitosos y fallidos) incluyendo geolocalización basada en la dirección IP del usuario, con representación visual en mapas integrados (React Leaflet).

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
FACEBOOK_APP_ID="..."
FACEBOOK_APP_SECRET="..."
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
   npx prisma migrate dev
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
