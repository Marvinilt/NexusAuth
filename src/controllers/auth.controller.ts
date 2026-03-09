import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { logger } from '../config/logger';
import { generateToken, TokenPayload } from '../utils/jwt';

const authService = new AuthService();

export class AuthController {
    async register(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;
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
            if (!email || !password) {
                res.status(400).json({ error: 'Email and password are required' });
                return;
            }
            const result = await authService.login(email, password);
            res.status(200).json(result);
        } catch (error: any) {
            if (error.message === 'Invalid credentials') {
                res.status(401).json({ error: error.message });
            } else {
                logger.error(`Login error: ${error.message}`);
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    }

    oauthCallback(req: Request, res: Response): void {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication failed' });
            return;
        }

        const authUser = req.user as any;

        if (authUser.mfaEnabled) {
            const payload: TokenPayload = { userId: authUser.id, email: authUser.email, mfaPending: true };
            const mfaToken = generateToken(payload, '5m');
            res.status(200).json({ mfaRequired: true, mfaToken, message: 'MFA verification required' });
            return;
        }

        const payload: TokenPayload = { userId: authUser.id, email: authUser.email };
        const token = generateToken(payload);
        res.status(200).json({ token, user: { id: authUser.id, email: authUser.email } });
    }
}
