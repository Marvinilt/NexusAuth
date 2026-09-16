import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { logger } from '../config/logger';

export const authRequired = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        res.status(401).json({ error: 'No se proporcionó cabecera de autorización' });
        return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({ error: 'Falta el token de autorización' });
        return;
    }

    try {
        const decoded = verifyToken(token);
        (req as any).user = decoded; // Contains userId and email
        next();
    } catch (error: any) {
        logger.warn(`Auth Error: ${error.message}`);
        res.status(401).json({ error: 'Token inválido o expirado' });
    }
};

export const mfaPendingRequired = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        res.status(401).json({ error: 'No se proporcionó cabecera de autorización' });
        return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({ error: 'Falta el token de autorización' });
        return;
    }

    try {
        const decoded = verifyToken(token);

        if (!decoded.mfaPending) {
            res.status(403).json({ error: 'El token está completamente autenticado, no requiere MFA' });
            return;
        }

        (req as any).user = decoded;
        next();
    } catch (error: any) {
        res.status(401).json({ error: 'Token inválido o expirado' });
    }
}
