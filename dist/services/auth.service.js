"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const prisma_1 = require("../config/prisma");
const crypto_1 = require("../utils/crypto");
const jwt_1 = require("../utils/jwt");
const validation_1 = require("../utils/validation");
const logger_1 = require("../config/logger");
const axios_1 = __importDefault(require("axios"));
class AuthService {
    async register(email, passwordHashRaw) {
        if (!(0, validation_1.validateEmail)(email)) {
            throw new Error('Invalid email format');
        }
        const { valid, message } = (0, validation_1.validatePasswordComplexity)(passwordHashRaw);
        if (!valid) {
            throw new Error(message);
        }
        const existingUser = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            throw new Error('User already exists');
        }
        const hashedPassword = await (0, crypto_1.hashPassword)(passwordHashRaw);
        const user = await prisma_1.prisma.user.create({
            data: {
                email,
                passwordHash: hashedPassword,
            },
        });
        return { id: user.id, email: user.email, mfaEnabled: user.mfaEnabled };
    }
    async login(email, passwordRaw) {
        const user = await prisma_1.prisma.user.findUnique({
            where: { email },
            include: { oauthProviders: true }
        });
        if (!user || (!user.passwordHash && user.oauthProviders.length > 0)) {
            logger_1.logger.info(`[AuthService.login] Login failed for ${email}: User not found or tried using password on a purely social account`);
            throw new Error('Invalid credentials');
        }
        if (user.passwordHash) {
            const isValid = await (0, crypto_1.comparePassword)(passwordRaw, user.passwordHash);
            if (!isValid) {
                logger_1.logger.info(`[AuthService.login] Login failed for ${email}: Incorrect password`);
                throw new Error('Invalid credentials');
            }
        }
        logger_1.logger.info(`[AuthService.login] Local login credentials verified for user: ${user.id} (${user.email})`);
        // Check if MFA is enabled
        if (user.mfaEnabled) {
            logger_1.logger.info(`[AuthService.login] User ${user.email} has MFA enabled. Issuing temporary MFA-pending token.`);
            // Issue a temporary token indicating MFA is pending
            const payload = { userId: user.id, email: user.email, mfaPending: true };
            const mfaToken = (0, jwt_1.generateToken)(payload, '15m');
            return { mfaRequired: true, mfaToken, message: 'MFA verification required' };
        }
        // Standard Login
        logger_1.logger.info(`[AuthService.login] Generating standard JWT token for user ${user.email} (MFA not enabled).`);
        const payload = { userId: user.id, email: user.email };
        const token = (0, jwt_1.generateToken)(payload);
        return { token, user: { id: user.id, email: user.email } };
    }
    async logUserLogin(userId, options) {
        let location = 'Unknown';
        let latitude = null;
        let longitude = null;
        // Simple geolocation for public IPs (if localhost, use server's public IP as simulation)
        try {
            const queryIp = (options.ipAddress === '::1' || options.ipAddress === '127.0.0.1' || !options.ipAddress) ? '' : options.ipAddress;
            const geoRes = await axios_1.default.get(`http://ip-api.com/json/${queryIp}`);
            if (geoRes.data.status === 'success') {
                location = `${geoRes.data.city}, ${geoRes.data.country}`;
                latitude = geoRes.data.lat;
                longitude = geoRes.data.lon;
                // If the IP was localhost or missing, fallback to the public IP resolved by the API
                if (!queryIp && geoRes.data.query) {
                    options.ipAddress = geoRes.data.query;
                }
            }
        }
        catch (err) {
            logger_1.logger.error(`Geo API failed: ${err}`);
        }
        const lastLogin = await prisma_1.prisma.loginLog.findFirst({
            where: { userId, status: 'SUCCESS' },
            orderBy: { createdAt: 'desc' },
        });
        await prisma_1.prisma.loginLog.create({
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
    async getLoginHistory(userId, limit = 5) {
        return prisma_1.prisma.loginLog.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
}
exports.AuthService = AuthService;
