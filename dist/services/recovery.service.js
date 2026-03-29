"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecoveryService = void 0;
const resend_1 = require("resend");
const prisma_1 = require("../config/prisma");
const jwt_1 = require("../utils/jwt");
const crypto_1 = require("../utils/crypto");
const resend = new resend_1.Resend(process.env.RESEND_API_KEY || 're_mock');
class RecoveryService {
    async sendRecoveryEmail(email) {
        const user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            // Do not reveal that a user doesn't exist just return
            return;
        }
        // Generate a 15-minute token specific for password recovery
        const token = (0, jwt_1.generateToken)({ userId: user.id, email: user.email }, '15m');
        // Normally this URL point to a frontend app where the user inputs their new password
        const recoveryUrl = `http://localhost:3000/reset-password?token=${token}`;
        try {
            const { data, error } = await resend.emails.send({
                from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
                to: email,
                subject: 'Password Recovery Instructions',
                html: `<p>Hello,</p>
                       <p>We received a request to reset your password. Click the link below to set a new one. This link will expire in 15 minutes.</p>
                       <a href="${recoveryUrl}">Reset Password</a>
                       <p>If you didn't request this, you can ignore this email.</p>`
            });
            if (error) {
                console.error('Failed to send email with Resend (API error):', error);
                throw new Error('Could not send recovery email');
            }
        }
        catch (error) {
            console.error('Failed to send email with Resend (Exception):', error);
            // Even if it fails, throw a generic error in real environment
            throw new Error('Could not send recovery email');
        }
    }
    async resetPassword(token, newPasswordRaw) {
        let payload;
        try {
            payload = (0, jwt_1.verifyToken)(token);
        }
        catch (error) {
            throw new Error('Invalid or expired recovery token');
        }
        const user = await prisma_1.prisma.user.findUnique({ where: { id: payload.userId } });
        if (!user) {
            throw new Error('User not found');
        }
        const hashedPassword = await (0, crypto_1.hashPassword)(newPasswordRaw);
        await prisma_1.prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: hashedPassword }
        });
        return { success: true };
    }
}
exports.RecoveryService = RecoveryService;
