"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const prisma_1 = require("../config/prisma");
const crypto_1 = require("../utils/crypto");
const jwt_1 = require("../utils/jwt");
const validation_1 = require("../utils/validation");
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
            throw new Error('Invalid credentials');
        }
        if (user.passwordHash) {
            const isValid = await (0, crypto_1.comparePassword)(passwordRaw, user.passwordHash);
            if (!isValid) {
                throw new Error('Invalid credentials');
            }
        }
        // Check if MFA is enabled
        if (user.mfaEnabled) {
            // Issue a temporary token indicating MFA is pending
            const payload = { userId: user.id, email: user.email, mfaPending: true };
            const mfaToken = (0, jwt_1.generateToken)(payload, '5m');
            return { mfaRequired: true, mfaToken, message: 'MFA verification required' };
        }
        // Standard Login
        const payload = { userId: user.id, email: user.email };
        const token = (0, jwt_1.generateToken)(payload);
        return { token, user: { id: user.id, email: user.email } };
    }
}
exports.AuthService = AuthService;
