import { Resend } from 'resend';
import { prisma } from '../config/prisma';
import { generateToken, verifyToken } from '../utils/jwt';
import { hashPassword } from '../utils/crypto';
import { config } from '../config/env';

const resend = new Resend(process.env.RESEND_API_KEY || 're_mock');

export class RecoveryService {
    async sendRecoveryEmail(email: string) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            // Do not reveal that a user doesn't exist just return
            return;
        }

        // Generate a 15-minute token specific for password recovery
        const token = generateToken({ userId: user.id, email: user.email }, '15m');

        // Normally this URL point to a frontend app where the user inputs their new password
        const recoveryUrl = `http://localhost:3000/reset-password?token=${token}`;

        try {
            await resend.emails.send({
                from: 'NexusAuth <noreply@nexusauth.com>',
                to: email,
                subject: 'Password Recovery Instructions',
                html: `<p>Hello,</p>
                       <p>We received a request to reset your password. Click the link below to set a new one. This link will expire in 15 minutes.</p>
                       <a href="${recoveryUrl}">Reset Password</a>
                       <p>If you didn't request this, you can ignore this email.</p>`
            });
        } catch (error) {
            console.error('Failed to send email with Resend:', error);
            // Even if it fails, throw a generic error in real environment
            throw new Error('Could not send recovery email');
        }
    }

    async resetPassword(token: string, newPasswordRaw: string) {
        let payload: any;
        try {
            payload = verifyToken(token);
        } catch (error) {
            throw new Error('Invalid or expired recovery token');
        }

        const user = await prisma.user.findUnique({ where: { id: payload.userId } });
        if (!user) {
            throw new Error('User not found');
        }

        const hashedPassword = await hashPassword(newPasswordRaw);

        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: hashedPassword }
        });

        return { success: true };
    }
}
