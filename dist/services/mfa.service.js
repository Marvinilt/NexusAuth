"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MfaService = void 0;
// Requires commonjs compatible import for otplib in some TS setups
const { authenticator } = require('otplib');
const qrcode_1 = __importDefault(require("qrcode"));
const prisma_1 = require("../config/prisma");
const crypto_1 = require("../utils/crypto");
const crypto_2 = __importDefault(require("crypto"));
class MfaService {
    constructor() {
        // Allow a drift of 1 step before or after current time
        // window: [past_steps, future_steps]
        authenticator.options = { window: [1, 1] };
    }
    async generateSetupData(userId, email) {
        const secret = authenticator.generateSecret();
        // Setup service name (e.g., NexusAuth) and user id/email
        const otpauth = authenticator.keyuri(email, 'NexusAuth', secret);
        const qrCodeUrl = await qrcode_1.default.toDataURL(otpauth);
        const encryptedSecret = (0, crypto_1.encryptMfaSecret)(secret);
        // Store the encrypted secret in db but don't enable MFA yet.
        await prisma_1.prisma.user.update({
            where: { id: userId },
            data: { mfaSecret: encryptedSecret, mfaEnabled: false },
        });
        return { secret, qrCodeUrl };
    }
    async verifyAndEnable(userId, token) {
        const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.mfaSecret) {
            throw new Error('MFA Setup not initiated');
        }
        const secret = (0, crypto_1.decryptMfaSecret)(user.mfaSecret);
        try {
            const isValid = authenticator.verify({ token, secret });
            if (!isValid) {
                throw new Error('Invalid TOTP token');
            }
            // Generate 10 Backup codes
            const backupCodes = Array.from({ length: 10 }, () => crypto_2.default.randomBytes(4).toString('hex'));
            const backupCodeHashes = backupCodes.map(code => ({
                codeHash: crypto_2.default.createHash('sha256').update(code).digest('hex'),
                userId: user.id
            }));
            // Mark MFA as enabled and save backup codes
            await prisma_1.prisma.$transaction([
                prisma_1.prisma.user.update({
                    where: { id: userId },
                    data: { mfaEnabled: true }
                }),
                prisma_1.prisma.backupCode.deleteMany({ where: { userId } }), // delete old backup codes if exist
                prisma_1.prisma.backupCode.createMany({ data: backupCodeHashes })
            ]);
            return { success: true, backupCodes };
        }
        catch (error) {
            throw new Error(error.message || 'Invalid TOTP token');
        }
    }
    async verifyLoginToken(userId, token) {
        const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.mfaSecret || !user.mfaEnabled) {
            throw new Error('MFA is not enabled for this user');
        }
        const secret = (0, crypto_1.decryptMfaSecret)(user.mfaSecret);
        const isValid = authenticator.verify({ token, secret });
        if (!isValid) {
            // Alternatively, fallback to testing if token is a backup code
            const hashedToken = crypto_2.default.createHash('sha256').update(token).digest('hex');
            const backupCode = await prisma_1.prisma.backupCode.findFirst({
                where: { userId, codeHash: hashedToken, used: false }
            });
            if (backupCode) {
                await prisma_1.prisma.backupCode.update({ where: { id: backupCode.id }, data: { used: true } });
                return true;
            }
            throw new Error('Invalid MFA token');
        }
        return true;
    }
}
exports.MfaService = MfaService;
