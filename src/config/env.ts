import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    masterEncryptionKey: process.env.MASTER_ENCRYPTION_KEY || 'default_32_byte_local_secret_key!',
    databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/DB_NexusAuth',
    jwtSecret: process.env.JWT_SECRET || 'nexusauth_super_secret_jwt_key_develop',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
    googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL,
    facebookAppId: process.env.FACEBOOK_APP_ID,
    facebookAppSecret: process.env.FACEBOOK_APP_SECRET,
    facebookCallbackUrl: process.env.FACEBOOK_CALLBACK_URL,
};

// Validations
if (!process.env.MASTER_ENCRYPTION_KEY && config.nodeEnv === 'production') {
    throw new Error('MASTER_ENCRYPTION_KEY is required in production environment.');
}
if (!process.env.JWT_SECRET && config.nodeEnv === 'production') {
    throw new Error('JWT_SECRET is required in production environment.');
}
