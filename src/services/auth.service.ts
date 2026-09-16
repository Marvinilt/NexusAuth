import { prisma } from '../config/prisma';
import { hashPassword, comparePassword } from '../utils/crypto';
import { generateToken, TokenPayload } from '../utils/jwt';
import { validateEmail, validatePasswordComplexity } from '../utils/validation';
import { logger } from '../config/logger';
import { config } from '../config/env';
import axios from 'axios';

export type LoginStatus = 'SUCCESS' | 'FAILED';

export interface LoginUser {
    id: string;
    email: string;
    isSuperAdmin?: boolean;
    lastLoginAt?: Date | null;
}

export interface LoginResult {
    mfaRequired?: boolean;
    mfaToken?: string;
    message?: string;
    token?: string;
    user?: LoginUser;
}

export class AuthService {
    async register(email: string, passwordHashRaw: string, clientId: string) {
        if (!validateEmail(email)) {
            throw new Error('Formato de correo electrónico inválido');
        }

        const { valid, message } = validatePasswordComplexity(passwordHashRaw);
        if (!valid) {
            throw new Error(message);
        }

        const existingUser = await prisma.user.findUnique({ where: { email_clientId: { email, clientId } } });
        if (existingUser) {
            throw new Error('El usuario ya existe');
        }

        const hashedPassword = await hashPassword(passwordHashRaw);

        const user = await prisma.user.create({
            data: {
                email,
                passwordHash: hashedPassword,
                clientId,
            },
        });

        return { id: user.id, email: user.email, mfaEnabled: user.mfaEnabled };
    }

    async login(email: string, passwordRaw: string, clientId: string) {
        const user = await prisma.user.findUnique({
            where: { email_clientId: { email, clientId } },
            include: { oauthProviders: true }
        });
        if (!user || (!user.passwordHash && user.oauthProviders.length > 0)) {
            logger.info(`[AuthService.login] Login failed for ${email}: User not found or tried using password on a purely social account`);
            throw new Error('Credenciales inválidas');
        }

        if (user.passwordHash) {
            const isValid = await comparePassword(passwordRaw, user.passwordHash);
            if (!isValid) {
                logger.info(`[AuthService.login] Login failed for ${email}: Incorrect password`);
                throw new Error('Credenciales inválidas');
            }
        }

        logger.info(`[AuthService.login] Local login credentials verified for user: ${user.id} (${user.email})`);

        const isSuperAdmin = user.email.toLowerCase() === config.superAdminEmail.toLowerCase();

        // Check if MFA is enabled
        if (user.mfaEnabled) {
            logger.info(`[AuthService.login] User ${user.email} has MFA enabled. Issuing temporary MFA-pending token.`);
            // Issue a temporary token indicating MFA is pending
            const payload: TokenPayload = { userId: user.id, email: user.email, clientId, mfaPending: true, isSuperAdmin };
            const mfaToken = generateToken(payload, '15m');
            return { mfaRequired: true, mfaToken, message: 'Se requiere verificación MFA' };
        }

        // Standard Login
        logger.info(`[AuthService.login] Generating standard JWT token for user ${user.email} (MFA not enabled).`);
        const payload: TokenPayload = { userId: user.id, email: user.email, clientId, isSuperAdmin };
        const token = generateToken(payload);

        return { token, user: { id: user.id, email: user.email, isSuperAdmin } };
    }

    /**
     * Registra un evento de inicio de sesión exitoso o fallido con metadatos de red, navegador y cliente.
     * @param userId - Identificador del usuario.
     * @param options - Opciones que incluyen estado, IP, agente de usuario y el identificador del sistema cliente.
     * @returns Fecha del último acceso exitoso previo, o null.
     */
    async logUserLogin(userId: string, options: {
        status: LoginStatus,
        ipAddress?: string,
        userAgent?: string,
        clientId?: string | null
    }): Promise<Date | null> {
        let location = 'Unknown';
        let latitude: number | null = null;
        let longitude: number | null = null;

        // Simple geolocation for public IPs (if localhost, use server's public IP as simulation)
        try {
            const rawIp = options.ipAddress || '';
            const isLocalhost = rawIp === '::1' || rawIp === '127.0.0.1' || rawIp.includes('127.0.0.1') || !rawIp;
            const queryIp = isLocalhost ? '' : rawIp;
            const geoRes = await axios.get(`http://ip-api.com/json/${queryIp}`, { timeout: 1500 });
            if (geoRes.data && geoRes.data.status === 'success') {
                location = `${geoRes.data.city}, ${geoRes.data.country}`;
                latitude = geoRes.data.lat;
                longitude = geoRes.data.lon;

                // If the IP was localhost or missing, fallback to the public IP resolved by the API
                if (isLocalhost && geoRes.data.query) {
                    options.ipAddress = geoRes.data.query;
                }
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error desconocido';
            logger.warn(`[AuthService.logUserLogin] Geolocation lookup skipped: ${message}`);
        }

        const lastLogin = await prisma.loginLog.findFirst({
            where: { userId, status: 'SUCCESS' },
            orderBy: { createdAt: 'desc' },
        });

        await prisma.loginLog.create({
            data: {
                userId,
                clientId: options.clientId ?? null,
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
