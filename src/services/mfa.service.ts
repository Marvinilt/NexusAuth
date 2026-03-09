// Requires commonjs compatible import for otplib in some TS setups
const { authenticator } = require('otplib');
import qrcode from 'qrcode';
import { prisma } from '../config/prisma';
import { encryptMfaSecret, decryptMfaSecret } from '../utils/crypto';
import crypto from 'crypto';

export class MfaService {
    constructor() {
        // Allow a drift of 1 step before or after current time
        // window: [past_steps, future_steps]
        authenticator.options = { window: [1, 1] };
    }

    async generateSetupData(userId: string, email: string) {
        const secret = authenticator.generateSecret();
        // Setup service name (e.g., NexusAuth) and user id/email
        const otpauth = authenticator.keyuri(email, 'NexusAuth', secret);
        const qrCodeUrl = await qrcode.toDataURL(otpauth);

        const encryptedSecret = encryptMfaSecret(secret);

        // Store the encrypted secret in db but don't enable MFA yet.
        await prisma.user.update({
            where: { id: userId },
            data: { mfaSecret: encryptedSecret, mfaEnabled: false },
        });

        return { secret, qrCodeUrl };
    }

    async verifyAndEnable(userId: string, token: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.mfaSecret) {
            throw new Error('MFA Setup not initiated');
        }

        const secret = decryptMfaSecret(user.mfaSecret);

        try {
            const isValid = authenticator.verify({ token, secret });

            if (!isValid) {
                throw new Error('Invalid TOTP token');
            }

            // Generate 10 Backup codes
            const backupCodes = Array.from({ length: 10 }, () => crypto.randomBytes(4).toString('hex'));

            const backupCodeHashes = backupCodes.map(code => ({
                codeHash: crypto.createHash('sha256').update(code).digest('hex'),
                userId: user.id
            }));

            // Mark MFA as enabled and save backup codes
            await prisma.$transaction([
                prisma.user.update({
                    where: { id: userId },
                    data: { mfaEnabled: true }
                }),
                prisma.backupCode.deleteMany({ where: { userId } }), // delete old backup codes if exist
                prisma.backupCode.createMany({ data: backupCodeHashes })
            ]);

            return { success: true, backupCodes };
        } catch (error: any) {
            throw new Error(error.message || 'Invalid TOTP token');
        }
    }

    async verifyLoginToken(userId: string, token: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.mfaSecret || !user.mfaEnabled) {
            throw new Error('MFA is not enabled for this user');
        }

        const secret = decryptMfaSecret(user.mfaSecret);

        const isValid = authenticator.verify({ token, secret });

        if (!isValid) {
            // Alternatively, fallback to testing if token is a backup code
            const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

            const backupCode = await prisma.backupCode.findFirst({
                where: { userId, codeHash: hashedToken, used: false }
            });

            if (backupCode) {
                await prisma.backupCode.update({ where: { id: backupCode.id }, data: { used: true } });
                return true;
            }

            throw new Error('Invalid MFA token');
        }

        return true;
    }
}
