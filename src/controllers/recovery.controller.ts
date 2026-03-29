import { Request, Response } from 'express';
import { RecoveryService } from '../services/recovery.service';
import { logger } from '../config/logger';

const recoveryService = new RecoveryService();

export class RecoveryController {
    async sendEmail(req: Request, res: Response): Promise<void> {
        try {
            const { email } = req.body;
            if (!email) {
                res.status(400).json({ error: 'El correo electrónico es requerido' });
                return;
            }

            // Await is handled inside, but we always return 200 so we do not
            // expose whether the email exists in the database.
            await recoveryService.sendRecoveryEmail(email);

            res.status(200).json({ message: 'Si el correo existe, se ha enviado un enlace de recuperación' });
        } catch (error: any) {
            logger.error(`Recovery Email Error: ${error.message}`);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }

    async resetPassword(req: Request, res: Response): Promise<void> {
        try {
            const { token, newPassword } = req.body;
            if (!token || !newPassword) {
                res.status(400).json({ error: 'El token y la nueva contraseña son requeridos' });
                return;
            }

            const result = await recoveryService.resetPassword(token, newPassword);
            res.status(200).json(result);
        } catch (error: any) {
            res.status(400).json({ error: error.message || 'Ocurrió un error al restablecer la contraseña' });
        }
    }
}
