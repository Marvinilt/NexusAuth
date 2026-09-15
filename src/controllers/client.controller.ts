import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { logger } from '../config/logger';

export class ClientController {
    async create(req: Request, res: Response): Promise<void> {
        try {
            const { name, allowedOrigins } = req.body;
            if (!name) {
                res.status(400).json({ error: 'El nombre del cliente es requerido' });
                return;
            }

            const client = await prisma.client.create({
                data: {
                    name,
                    allowedOrigins: allowedOrigins || []
                }
            });

            logger.info(`[ClientController] Nuevo sistema cliente registrado: ${name} (${client.id})`);
            res.status(201).json({ 
                message: 'Cliente creado exitosamente. Guarda el apiKey, es requerido para consumir la API.',
                client 
            });
        } catch (error: any) {
            logger.error(`[ClientController] Error creating client: ${error.message}`);
            res.status(500).json({ error: 'Error interno al crear cliente' });
        }
    }

    async list(req: Request, res: Response): Promise<void> {
        try {
            const clients = await prisma.client.findMany({
                orderBy: { createdAt: 'desc' }
            });
            res.status(200).json(clients);
        } catch (error: any) {
            logger.error(`[ClientController] Error listing clients: ${error.message}`);
            res.status(500).json({ error: 'Error interno al listar clientes' });
        }
    }

    async delete(req: Request, res: Response): Promise<void> {
        try {
            const id = req.params.id as string;
            await prisma.client.delete({
                where: { id }
            });
            res.status(200).json({ message: 'Cliente eliminado' });
        } catch (error: any) {
            res.status(500).json({ error: 'Error al eliminar cliente' });
        }
    }
}
