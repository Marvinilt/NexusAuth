import { Resend } from 'resend';
import { prisma } from '../config/prisma';
import { generateToken, verifyToken } from '../utils/jwt';
import { hashPassword } from '../utils/crypto';
import { config } from '../config/env';

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock');

export class RecoveryService {
    async sendRecoveryEmail(email: string, clientId: string) {
        const user = await prisma.user.findUnique({ where: { email_clientId: { email, clientId } } });
        if (!user) {
            // Do not reveal that a user doesn't exist just return
            return;
        }

        // Generate a 15-minute token specific for password recovery
        const token = generateToken({ userId: user.id, email: user.email, clientId: user.clientId }, '15m');

        // Normally this URL point to a frontend app where the user inputs their new password
        const recoveryUrl = `http://localhost:5173/reset-password?token=${token}`;

        try {
            const { data, error } = await resend.emails.send({
                from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
                to: email,
                subject: 'Password Recovery Instructions',
                html: `<p>Hello,</p>
                       <p>We received a request to reset your password. Click the link below to set a new one. This link will expire in 15 minutes.</p>
                       <a href="${recoveryUrl}">Restablecer Contraseña</a>
                       <p>If you didn't request this, you can ignore this email.</p>`
            });

            if (error) {
                console.error('Failed to send email with Resend (API error):', error);
                throw new Error('No se pudo enviar el correo de recuperación');
            }
        } catch (error) {
            console.error('Failed to send email with Resend (Exception):', error);
            // Even if it fails, throw a generic error in real environment
            throw new Error('No se pudo enviar el correo de recuperación');
        }
    }

    /**
     * Restablece la contraseña del usuario utilizando un token de recuperación válido.
     * Actualiza la fecha de cambio y registra un evento en la bitácora de auditoría.
     * @param token - Token JWT de recuperación recibido por el usuario.
     * @param newPasswordRaw - Nueva contraseña en texto plano para hashear.
     * @param meta - Metadatos opcionales de la petición (IP y User Agent).
     * @returns Objeto indicando el resultado exitoso.
     */
    async resetPassword(token: string, newPasswordRaw: string, meta?: { ipAddress?: string; userAgent?: string }): Promise<{ success: boolean }> {
        let payload: { userId: string };
        try {
            payload = verifyToken(token) as { userId: string };
        } catch {
            throw new Error('Token de recuperación inválido o expirado');
        }

        const user = await prisma.user.findUnique({ where: { id: payload.userId } });
        if (!user) {
            throw new Error('Usuario no encontrado');
        }

        const hashedPassword = await hashPassword(newPasswordRaw);
        const now = new Date();

        await prisma.$transaction([
            prisma.user.update({
                where: { id: user.id },
                data: {
                    passwordHash: hashedPassword,
                    passwordChangedAt: now
                }
            }),
            prisma.passwordChangeLog.create({
                data: {
                    userId: user.id,
                    clientId: user.clientId,
                    ipAddress: meta?.ipAddress,
                    userAgent: meta?.userAgent,
                    createdAt: now
                }
            })
        ]);

        return { success: true };
    }
}
