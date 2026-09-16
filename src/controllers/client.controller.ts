import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { prisma } from '../config/prisma';
import { logger } from '../config/logger';

export class ClientController {
    /**
     * Registra un nuevo sistema cliente con su nombre y orígenes permitidos.
     * @param req - Objeto de solicitud Express con name y allowedOrigins en el cuerpo.
     * @param res - Objeto de respuesta Express.
     */
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
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error desconocido';
            logger.error(`[ClientController] Error creating client: ${message}`);
            res.status(500).json({ error: 'Error interno al crear cliente' });
        }
    }

    /**
     * Lista todos los sistemas clientes registrados en orden descendente por fecha de creación.
     * @param req - Objeto de solicitud Express.
     * @param res - Objeto de respuesta Express.
     */
    async list(req: Request, res: Response): Promise<void> {
        try {
            const clients = await prisma.client.findMany({
                orderBy: { createdAt: 'desc' }
            });
            res.status(200).json(clients);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error desconocido';
            logger.error(`[ClientController] Error listing clients: ${message}`);
            res.status(500).json({ error: 'Error interno al listar clientes' });
        }
    }

    /**
     * Regenera el apiKey único de un sistema cliente existente.
     * @param req - Objeto de solicitud Express con el id del cliente en los parámetros.
     * @param res - Objeto de respuesta Express.
     */
    async regenerateKey(req: Request, res: Response): Promise<void> {
        try {
            const id = req.params.id as string;
            const newApiKey = randomUUID();

            const client = await prisma.client.update({
                where: { id },
                data: { apiKey: newApiKey }
            });

            logger.info(`[ClientController] ApiKey regenerado para cliente ${client.name} (${client.id})`);
            res.status(200).json({
                message: 'ApiKey regenerado exitosamente',
                client
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error desconocido';
            logger.error(`[ClientController] Error regenerating key: ${message}`);
            res.status(500).json({ error: 'Error interno al regenerar apiKey del cliente' });
        }
    }

    /**
     * Elimina un sistema cliente de la base de datos por su identificador.
     * @param req - Objeto de solicitud Express con el id del cliente en los parámetros.
     * @param res - Objeto de respuesta Express.
     */
    async delete(req: Request, res: Response): Promise<void> {
        try {
            const id = req.params.id as string;
            await prisma.client.delete({
                where: { id }
            });
            res.status(200).json({ message: 'Cliente eliminado' });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error desconocido';
            logger.error(`[ClientController] Error deleting client: ${message}`);
            res.status(500).json({ error: 'Error al eliminar cliente' });
        }
    }
}

