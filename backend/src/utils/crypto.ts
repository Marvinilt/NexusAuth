import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { config } from '../config/env';

const ALGORITHM = 'aes-256-gcm';
// Ensure the key is exactly 32 bytes (256 bits) for aes-256
const ENCRYPTION_KEY = crypto.scryptSync(config.masterEncryptionKey, 'salt', 32);

export const hashPassword = async (password: string): Promise<string> => {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(password, hash);
};

export const encryptMfaSecret = (text: string): string => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    // Format: iv:authTag:encryptedData
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

export const decryptMfaSecret = (encryptedText: string): string => {
    const [ivHex, authTagHex, encryptedData] = encryptedText.split(':');

    if (!ivHex || !authTagHex || !encryptedData) {
        throw new Error('Formato de secreto MFA encriptado inválido');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
};
