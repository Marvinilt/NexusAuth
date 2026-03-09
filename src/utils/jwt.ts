import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export interface TokenPayload {
    userId: string;
    email: string;
    mfaPending?: boolean;
}

import { SignOptions } from 'jsonwebtoken';

export const generateToken = (payload: TokenPayload, expiresIn: string = config.jwtExpiresIn): string => {
    return jwt.sign(payload, config.jwtSecret, { expiresIn } as SignOptions);
};

export const verifyToken = (token: string): TokenPayload => {
    try {
        return jwt.verify(token, config.jwtSecret) as TokenPayload;
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
};
