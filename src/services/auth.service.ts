import { prisma } from '../config/prisma';
import { hashPassword, comparePassword } from '../utils/crypto';
import { generateToken, TokenPayload } from '../utils/jwt';
import { validateEmail, validatePasswordComplexity } from '../utils/validation';

export class AuthService {
    async register(email: string, passwordHashRaw: string) {
        if (!validateEmail(email)) {
            throw new Error('Invalid email format');
        }

        const { valid, message } = validatePasswordComplexity(passwordHashRaw);
        if (!valid) {
            throw new Error(message);
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            throw new Error('User already exists');
        }

        const hashedPassword = await hashPassword(passwordHashRaw);

        const user = await prisma.user.create({
            data: {
                email,
                passwordHash: hashedPassword,
            },
        });

        return { id: user.id, email: user.email, mfaEnabled: user.mfaEnabled };
    }

    async login(email: string, passwordRaw: string) {
        const user = await prisma.user.findUnique({
            where: { email },
            include: { oauthProviders: true }
        });
        if (!user || (!user.passwordHash && user.oauthProviders.length > 0)) {
            throw new Error('Invalid credentials');
        }

        if (user.passwordHash) {
            const isValid = await comparePassword(passwordRaw, user.passwordHash);
            if (!isValid) {
                throw new Error('Invalid credentials');
            }
        }

        // Check if MFA is enabled
        if (user.mfaEnabled) {
            // Issue a temporary token indicating MFA is pending
            const payload: TokenPayload = { userId: user.id, email: user.email, mfaPending: true };
            const mfaToken = generateToken(payload, '5m');
            return { mfaRequired: true, mfaToken, message: 'MFA verification required' };
        }

        // Standard Login
        const payload: TokenPayload = { userId: user.id, email: user.email };
        const token = generateToken(payload);

        return { token, user: { id: user.id, email: user.email } };
    }
}
