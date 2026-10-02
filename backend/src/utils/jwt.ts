import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { logger } from '../config/logger';

export interface TokenPayload {
    userId: string;
    email: string;
    clientId: string;
    mfaPending?: boolean;
    isSuperAdmin?: boolean;
}

import { SignOptions } from 'jsonwebtoken';

export const generateToken = (payload: TokenPayload, expiresIn: string = config.jwtExpiresIn): string => {
    return jwt.sign(payload, config.jwtSecret, { 
        expiresIn,
        audience: payload.clientId
    } as SignOptions);
};

export const verifyToken = (token: string): TokenPayload => {
    try {
        const decoded = jwt.verify(token, config.jwtSecret) as TokenPayload & { aud: string };
        // Si queremos ser estrictos, podemos validar el aud, 
        // pero por ahora el decoded lo tendra en aud y clientId
        return decoded;
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Error desconocido';
        logger.error(`JWT_VERIFY_ERROR: ${message} - Token start: ${token ? token.substring(0, 15) : 'null'}`);
        throw new Error('Token inválido o expirado');
    }
};
