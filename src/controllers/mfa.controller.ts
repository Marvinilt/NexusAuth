import { Request, Response } from 'express';
import { MfaService } from '../services/mfa.service';
import { logger } from '../config/logger';
import { generateToken, TokenPayload } from '../utils/jwt';
import { AuthService } from '../services/auth.service';
import { config } from '../config/env';

const mfaService = new MfaService();
const authService = new AuthService();

export class MfaController {
    async setup(req: Request, res: Response): Promise<void> {
        try {
            const user = req.user as TokenPayload;
            const data = await mfaService.generateSetupData(user.userId, user.email);
            res.status(200).json(data);
        } catch (error: unknown) {
            const err = error as Error;
            logger.error(`MFA Setup Error: ${err.message}`);
            res.status(500).json({ error: 'Error al configurar MFA' });
        }
    }

    async verify(req: Request, res: Response): Promise<void> {
        try {
            const user = req.user as TokenPayload;
            const { token } = req.body;

            if (!token) {
                res.status(400).json({ error: 'El token es requerido' });
                return;
            }

            const result = await mfaService.verifyAndEnable(user.userId, token);
            logger.info(`USER_MFA_ACTIVATED: User ${user.userId} enabled 2FA`);
            res.status(200).json(result);
        } catch (error: unknown) {
            const err = error as Error;
            const user = req.user as TokenPayload | undefined;
            logger.info(`AUTH_INVALID_TOTP: MFA Setup verify failed for user ${user?.userId}`);
            res.status(400).json({ error: err.message });
        }
    }

    async loginVerify(req: Request, res: Response): Promise<void> {
        try {
            const user = req.user as TokenPayload;
            const { token } = req.body;

            if (!token) {
                res.status(400).json({ error: 'El token es requerido' });
                return;
            }

            const isValid = await mfaService.verifyLoginToken(user.userId, token);
            if (!isValid) throw new Error('Token MFA inválido');

            const isSuperAdmin = user.email.toLowerCase() === config.superAdminEmail.toLowerCase();
            const logClientId = isSuperAdmin ? null : user.clientId;

            const ipAddress = req.ip || req.socket.remoteAddress;
            const userAgent = (req.headers['user-agent'] as string) || 'Unknown';
            const lastLoginAt = await authService.logUserLogin(user.userId, {
                status: 'SUCCESS',
                ipAddress,
                userAgent,
                clientId: logClientId,
            });

            const payload: TokenPayload = { userId: user.userId, email: user.email, clientId: user.clientId, isSuperAdmin };
            const fullToken = generateToken(payload);

            res.status(200).json({ token: fullToken, user: { id: user.userId, email: user.email, lastLoginAt, isSuperAdmin } });

        } catch (error: unknown) {
            const err = error as Error;
            const user = req.user as TokenPayload | undefined;
            logger.info(`AUTH_MFA_FAILED: Login failed for user ${user?.userId}. Error: ${err.message}`);

            try {
                if (user && user.userId) {
                    const isSuperAdmin = user.email?.toLowerCase() === config.superAdminEmail.toLowerCase();
                    const logClientId = isSuperAdmin ? null : user.clientId;
                    await authService.logUserLogin(user.userId, {
                        status: 'FAILED',
                        ipAddress: req.ip || req.socket.remoteAddress,
                        userAgent: (req.headers['user-agent'] as string) || 'Unknown',
                        clientId: logClientId,
                    });
                }
            } catch (logErr) {
                logger.error(`Failed to log failed MFA metadata: ${logErr}`);
            }

            res.status(401).json({ error: err.message || 'Token inválido o expirado' });
        }
    }
}
