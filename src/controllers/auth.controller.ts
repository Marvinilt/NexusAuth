import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { logger } from '../config/logger';
import { generateToken, TokenPayload } from '../utils/jwt';
import { prisma } from '../config/prisma';

const authService = new AuthService();

export class AuthController {
    async register(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;
            logger.info(`[AuthController.register] Incoming register request for email: ${email}`);
            if (!email || !password) {
                res.status(400).json({ error: 'Email and password are required' });
                return;
            }
            const user = await authService.register(email, password);
            res.status(201).json({ message: 'User registered successfully', user });
        } catch (error: any) {
            if (error.message.includes('already exists') || error.message.includes('Invalid') || error.message.includes('Password must')) {
                res.status(400).json({ error: error.message });
            } else {
                logger.error(`Registration error: ${error.message}`);
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    }

    async login(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;
            logger.info(`[AuthController.login] Incoming login request for email: ${email}`);
            if (!email || !password) {
                res.status(400).json({ error: 'Email and password are required' });
                return;
            }
            const result = await authService.login(email, password);

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
        } catch (error: any) {
            // Log local failure if we can find the user
            try {
                const tempUser = await prisma.user.findUnique({ where: { email: req.body.email } });
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

            if (error.message === 'Invalid credentials') {
                res.status(401).json({ error: error.message });
            } else {
                logger.error(`Login error: ${error.message}`);
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    }

    async oauthCallback(req: Request, res: Response): Promise<void> {
        if (!req.user) {
            logger.error(`[AuthController.oauthCallback] Authentication failed to return an OAuth user object`);
            res.status(401).json({ error: 'Authentication failed' });
            return;
        }

        const authUser = req.user as any;
        logger.info(`[AuthController.oauthCallback] Handling successful OAuth callback for user: ${authUser.email}`);

        if (authUser.mfaEnabled) {
            const payload: TokenPayload = { userId: authUser.id, email: authUser.email, mfaPending: true };
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

        const payload: TokenPayload = { userId: authUser.id, email: authUser.email };
        const token = generateToken(payload);
        const userData = JSON.stringify({ id: authUser.id, email: authUser.email, lastLoginAt });

        // Redirect to frontend's callback capture page with token and user data
        res.redirect(`http://localhost:5173/oauth/callback?token=${token}&user=${encodeURIComponent(userData)}`);
    }

    async getHistory(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;
            const history = await authService.getLoginHistory(user.userId);
            res.json(history);
        } catch (error: any) {
            res.status(500).json({ error: 'Failed to fetch history' });
        }
    }
}
