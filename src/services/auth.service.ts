import { prisma } from '../config/prisma';
import { hashPassword, comparePassword } from '../utils/crypto';
import { generateToken, TokenPayload } from '../utils/jwt';
import { validateEmail, validatePasswordComplexity } from '../utils/validation';
import { logger } from '../config/logger';
import axios from 'axios';

type LoginStatus = 'SUCCESS' | 'FAILED';

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
            logger.info(`[AuthService.login] Login failed for ${email}: User not found or tried using password on a purely social account`);
            throw new Error('Invalid credentials');
        }

        if (user.passwordHash) {
            const isValid = await comparePassword(passwordRaw, user.passwordHash);
            if (!isValid) {
                logger.info(`[AuthService.login] Login failed for ${email}: Incorrect password`);
                throw new Error('Invalid credentials');
            }
        }

        logger.info(`[AuthService.login] Local login credentials verified for user: ${user.id} (${user.email})`);

        // Check if MFA is enabled
        if (user.mfaEnabled) {
            logger.info(`[AuthService.login] User ${user.email} has MFA enabled. Issuing temporary MFA-pending token.`);
            // Issue a temporary token indicating MFA is pending
            const payload: TokenPayload = { userId: user.id, email: user.email, mfaPending: true };
            const mfaToken = generateToken(payload, '15m');
            return { mfaRequired: true, mfaToken, message: 'MFA verification required' };
        }

        // Standard Login
        logger.info(`[AuthService.login] Generating standard JWT token for user ${user.email} (MFA not enabled).`);
        const payload: TokenPayload = { userId: user.id, email: user.email };
        const token = generateToken(payload);

        return { token, user: { id: user.id, email: user.email } };
    }

    async logUserLogin(userId: string, options: {
        status: LoginStatus,
        ipAddress?: string,
        userAgent?: string
    }): Promise<Date | null> {
        let location = 'Unknown';
        let latitude: number | null = null;
        let longitude: number | null = null;

        // Simple geolocation for public IPs (if localhost, use server's public IP as simulation)
        try {
            const queryIp = (options.ipAddress === '::1' || options.ipAddress === '127.0.0.1' || !options.ipAddress) ? '' : options.ipAddress;
            const geoRes = await axios.get(`http://ip-api.com/json/${queryIp}`);
            if (geoRes.data.status === 'success') {
                location = `${geoRes.data.city}, ${geoRes.data.country}`;
                latitude = geoRes.data.lat;
                longitude = geoRes.data.lon;
            }
        } catch (err) {
            logger.error(`Geo API failed: ${err}`);
        }

        const lastLogin = await prisma.loginLog.findFirst({
            where: { userId, status: 'SUCCESS' },
            orderBy: { createdAt: 'desc' },
        });

        await prisma.loginLog.create({
            data: {
                userId,
                status: options.status,
                ipAddress: options.ipAddress,
                userAgent: options.userAgent,
                location,
                latitude,
                longitude,
            },
        });

        return lastLogin ? lastLogin.createdAt : null;
    }

    async getLoginHistory(userId: string, limit = 5) {
        return prisma.loginLog.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
}
