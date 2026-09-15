import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { logger } from '../config/logger';
import { generateToken, TokenPayload } from '../utils/jwt';
import { prisma } from '../config/prisma';

const authService = new AuthService();

export class AuthController {
    /**
     * Registra un nuevo usuario en la base de datos asociado al cliente autenticado.
     * @param req - Objeto de solicitud Express con email y contraseña.
     * @param res - Objeto de respuesta Express.
     */
    async register(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;
            logger.info(`[AuthController.register] Incoming register request for email: ${email}`);
            if (!email || !password) {
                res.status(400).json({ error: 'El correo y la contraseña son requeridos' });
                return;
            }
            const clientId = req.client?.id;
            if (!clientId) {
                res.status(400).json({ error: 'Identificador de cliente no disponible' });
                return;
            }
            const user = await authService.register(email, password, clientId);
            res.status(201).json({ message: 'Usuario registrado exitosamente', user });
        } catch (error: unknown) {
            const err = error as { message?: string; code?: string };
            const errorMessage = err.message || '';

            // Conflictos de usuario duplicado (Prisma P2002 o validación interna)
            if (err.code === 'P2002' || errorMessage.includes('ya existe') || errorMessage.includes('already exists')) {
                res.status(400).json({ error: 'El usuario ya existe' });
                return;
            }

            // Errores de validación de correo y complejidad de contraseña
            if (
                errorMessage.includes('Formato de correo') ||
                errorMessage.includes('contraseña') ||
                errorMessage.includes('Invalid') ||
                errorMessage.includes('Password must')
            ) {
                res.status(400).json({ error: errorMessage });
                return;
            }

            logger.error(`Registration error: ${errorMessage}`);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }

    /**
     * Autentica un usuario con email y contraseña para el cliente actual.
     * @param req - Objeto de solicitud Express con credenciales de acceso.
     * @param res - Objeto de respuesta Express.
     */
    async login(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;
            logger.info(`[AuthController.login] Incoming login request for email: ${email}`);
            if (!email || !password) {
                res.status(400).json({ error: 'El correo y la contraseña son requeridos' });
                return;
            }
            const clientId = req.client?.id;
            if (!clientId) {
                res.status(400).json({ error: 'Identificador de cliente no disponible' });
                return;
            }
            const result = await authService.login(email, password, clientId);

            if (!result.mfaRequired && result.user) {
                const ipAddress = req.ip || req.socket.remoteAddress;
                const userAgent = (req.headers['user-agent'] as string) || 'Unknown';
                const lastLoginAt = await authService.logUserLogin(result.user.id, {
                    status: 'SUCCESS',
                    ipAddress,
                    userAgent
                });
                (result.user as any).lastLoginAt = lastLoginAt;
            }

            res.status(200).json(result);
        } catch (error: unknown) {
            const err = error as { message?: string };
            const errorMessage = err.message || '';

            // Log local failure if we can find the user
            try {
                const clientId = req.client?.id;
                const tempUser = clientId ? await prisma.user.findUnique({ where: { email_clientId: { email: req.body.email, clientId } } }) : null;
                if (tempUser) {
                    await authService.logUserLogin(tempUser.id, {
                        status: 'FAILED',
                        ipAddress: req.ip || req.socket.remoteAddress,
                        userAgent: (req.headers['user-agent'] as string) || 'Unknown'
                    });
                }
            } catch (logErr) {
                logger.error(`Failed to log failed login: ${logErr}`);
            }

            if (errorMessage === 'Credenciales inválidas' || errorMessage === 'Invalid credentials') {
                res.status(401).json({ error: errorMessage });
            } else {
                logger.error(`Login error: ${errorMessage}`);
                res.status(500).json({ error: 'Error interno del servidor' });
            }
        }
    }

    /**
     * Procesa la redirección y autenticación exitosa desde proveedores OAuth (Google, Facebook, GitHub).
     * @param req - Objeto de solicitud Express con el usuario autenticado por Passport.
     * @param res - Objeto de respuesta Express para redirección.
     */
    async oauthCallback(req: Request, res: Response): Promise<void> {
        if (!req.user) {
            logger.error(`[AuthController.oauthCallback] Authentication failed to return an OAuth user object`);
            res.status(401).json({ error: 'Autenticación fallida' });
            return;
        }

        const authUser = req.user as any;
        logger.info(`[AuthController.oauthCallback] Handling successful OAuth callback for user: ${authUser.email}`);

        if (authUser.mfaEnabled) {
            const payload: TokenPayload = { userId: authUser.id, email: authUser.email, clientId: authUser.clientId, mfaPending: true };
            const mfaToken = generateToken(payload, '15m');
            // Redirect to frontend's MFA verification page with the temporary token
            res.redirect(`http://localhost:5173/mfa-verify?mfaToken=${mfaToken}`);
            return;
        }

        const ipAddress = req.ip || req.socket.remoteAddress;
        const userAgent = (req.headers['user-agent'] as string) || 'Unknown';
        const lastLoginAt = await authService.logUserLogin(authUser.id, {
            status: 'SUCCESS',
            ipAddress,
            userAgent
        });

        const payload: TokenPayload = { userId: authUser.id, email: authUser.email, clientId: authUser.clientId };
        const token = generateToken(payload);
        const userData = JSON.stringify({ id: authUser.id, email: authUser.email, lastLoginAt });

        // Redirect to frontend's callback capture page with token and user data
        res.redirect(`http://localhost:5173/oauth/callback?token=${token}&user=${encodeURIComponent(userData)}`);
    }

    /**
     * Obtiene el historial de accesos del usuario autenticado actual.
     * @param req - Objeto de solicitud Express con datos del token verificado.
     * @param res - Objeto de respuesta Express.
     */
    async getHistory(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;
            const history = await authService.getLoginHistory(user.userId);
            res.json(history);
        } catch (error: unknown) {
            res.status(500).json({ error: 'Error al obtener el historial' });
        }
    }
}
