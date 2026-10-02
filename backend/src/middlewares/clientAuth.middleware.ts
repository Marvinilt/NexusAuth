import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { logger } from '../config/logger';

// Extend Express Request interface to include client
declare global {
  namespace Express {
    interface Request {
      client?: {
        id: string;
        name: string;
      };
    }
  }
}

export const clientAuthMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const apiKey = (req.headers['x-api-key'] as string) || (req.query.apiKey as string);

        if (!apiKey) {
            logger.warn(`[ClientAuth] Request denied: Missing x-api-key header or apiKey query param for path ${req.path}`);
            res.status(401).json({ error: 'API Key requerida (x-api-key header o apiKey query)' });
            return;
        }

        const client = await prisma.client.findUnique({
            where: { apiKey }
        });

        if (!client) {
            logger.warn(`[ClientAuth] Request denied: Invalid API Key provided for path ${req.path}`);
            res.status(401).json({ error: 'API Key inválida' });
            return;
        }

        const origin = req.headers.origin;
        // Si hay origen y el array de allowedOrigins del cliente no está vacío, lo validamos.
        // También podemos ser estrictos y exigir que si origin viene, tiene que estar en la lista si o si (incluso si está vacía).
        if (origin && !client.allowedOrigins.includes(origin)) {
            logger.warn(`[ClientAuth] Request denied: Origin ${origin} not allowed for client ${client.name}`);
            res.status(403).json({ error: 'CORS: Origen no permitido para este cliente' });
            return;
        }

        // Inyectar el cliente en la request
        req.client = {
            id: client.id,
            name: client.name
        };

        next();
    } catch (error) {
        logger.error(`[ClientAuth] Internal error: ${error}`);
        res.status(500).json({ error: 'Error interno de autenticación de cliente' });
    }
};
