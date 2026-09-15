import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../utils/jwt';
import { config } from '../config/env';

/**
 * Middleware para validar que el usuario autenticado tiene rol de Super Administrador.
 * Verifica el JWT provisto en la cabecera Authorization y comprueba el email contra la configuración.
 */
export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Token de autenticación no provisto' });
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        const payload: TokenPayload = verifyToken(token);

        const isSuperAdmin = payload.isSuperAdmin || 
            (payload.email && payload.email.toLowerCase() === config.superAdminEmail.toLowerCase());

        if (!isSuperAdmin) {
            res.status(403).json({ error: 'Acceso denegado: se requieren privilegios de Super Administrador' });
            return;
        }

        // Asignar el usuario verificado a la petición
        (req as Request & { user: TokenPayload }).user = payload;
        next();
    } catch {
        res.status(401).json({ error: 'Token inválido o expirado' });
    }
};
