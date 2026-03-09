import { Request, Response } from 'express';
import { MfaService } from '../services/mfa.service';
import { logger } from '../config/logger';
import { generateToken, TokenPayload } from '../utils/jwt';

const mfaService = new MfaService();

export class MfaController {
    async setup(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;
            const data = await mfaService.generateSetupData(user.userId, user.email);
            res.status(200).json(data);
        } catch (error: any) {
            logger.error(`MFA Setup Error: ${error.message}`);
            res.status(500).json({ error: 'Failed to setup MFA' });
        }
    }

    async verify(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;
            const { token } = req.body;

            if (!token) {
                res.status(400).json({ error: 'Token is required' });
                return;
            }

            const result = await mfaService.verifyAndEnable(user.userId, token);
            logger.info(`USER_MFA_ACTIVATED: User ${user.userId} enabled 2FA`);
            res.status(200).json(result);
        } catch (error: any) {
            logger.info(`AUTH_INVALID_TOTP: MFA Setup verify failed for user ${(req as any).user?.userId}`);
            res.status(400).json({ error: error.message });
        }
    }

    async loginVerify(req: Request, res: Response): Promise<void> {
        try {
            const user = (req as any).user;
            const { token } = req.body;

            if (!token) {
                res.status(400).json({ error: 'Token is required' });
                return;
            }

            const isValid = await mfaService.verifyLoginToken(user.userId, token);
            if (!isValid) throw new Error('Invalid MFA token');

            const payload: TokenPayload = { userId: user.userId, email: user.email };
            const fullToken = generateToken(payload);

            res.status(200).json({ token: fullToken, user: { id: user.userId, email: user.email } });

        } catch (error: any) {
            logger.info(`AUTH_INVALID_TOTP: Login failed for user ${(req as any).user?.userId}`);
            res.status(401).json({ error: error.message });
        }
    }
}
