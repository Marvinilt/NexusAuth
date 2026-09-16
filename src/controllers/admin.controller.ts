import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { logger } from '../config/logger';

interface DateFilter {
    gte?: Date;
    lte?: Date;
}

export class AdminController {
    /**
     * Obtiene estadísticas de usuarios y seguridad para un sistema cliente o de forma global.
     * Soporta rangos: hoy, últimos 7 días, últimos 30 días o fechas personalizadas.
     * @param req - Objeto de solicitud Express con clientId, range, from y to en query params.
     * @param res - Objeto de respuesta Express.
     */
    async getStats(req: Request, res: Response): Promise<void> {
        try {
            const clientId = req.query.clientId as string | undefined;
            const range = (req.query.range as string) || '7d';
            const fromParam = req.query.from as string | undefined;
            const toParam = req.query.to as string | undefined;

            const now = new Date();
            let startDate: Date | undefined;
            let endDate: Date = now;

            if (range === 'today') {
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            } else if (range === '7d') {
                startDate = new Date();
                startDate.setDate(now.getDate() - 7);
            } else if (range === '30d') {
                startDate = new Date();
                startDate.setDate(now.getDate() - 30);
            } else if (range === 'custom' && fromParam) {
                const parsedStart = new Date(fromParam);
                if (!isNaN(parsedStart.getTime())) {
                    startDate = parsedStart;
                }
                if (toParam) {
                    const parsedEnd = new Date(toParam);
                    if (!isNaN(parsedEnd.getTime())) {
                        parsedEnd.setHours(23, 59, 59, 999);
                        endDate = parsedEnd;
                    }
                }
            }

            const dateFilter: DateFilter = {};
            if (startDate) dateFilter.gte = startDate;
            if (endDate) dateFilter.lte = endDate;

            const clientWhere = clientId && clientId !== 'all' ? { clientId } : {};

            // 1. Total de usuarios registrados (histórico general del cliente)
            const totalUsers = await prisma.user.count({
                where: clientWhere
            });

            // 2. Nuevos usuarios en el rango seleccionado
            const newUsersInRange = await prisma.user.count({
                where: {
                    ...clientWhere,
                    ...(startDate ? { createdAt: dateFilter } : {})
                }
            });

            // 3. Usuarios por tipo de registro (Email vs Redes Sociales)
            const usersWithOAuth = await prisma.user.count({
                where: {
                    ...clientWhere,
                    oauthProviders: { some: {} }
                }
            });
            const usersEmailOnly = Math.max(0, totalUsers - usersWithOAuth);

            // 4. Cambios de contraseña realizados en el rango
            const passwordChangesCount = await prisma.passwordChangeLog.count({
                where: {
                    ...clientWhere,
                    ...(startDate ? { createdAt: dateFilter } : {})
                }
            });

            // 5. Usuarios con 2FA / MFA activado
            const mfaEnabledCount = await prisma.user.count({
                where: {
                    ...clientWhere,
                    mfaEnabled: true
                }
            });

            // 6. Resumen de inicios de sesión en el rango
            const successfulLogins = await prisma.loginLog.count({
                where: {
                    ...clientWhere,
                    status: 'SUCCESS',
                    ...(startDate ? { createdAt: dateFilter } : {})
                }
            });

            const failedLogins = await prisma.loginLog.count({
                where: {
                    ...clientWhere,
                    status: 'FAILED',
                    ...(startDate ? { createdAt: dateFilter } : {})
                }
            });

            res.status(200).json({
                summary: {
                    totalUsers,
                    newUsersInRange,
                    passwordChanges: passwordChangesCount,
                    mfaEnabledUsers: mfaEnabledCount,
                    successfulLogins,
                    failedLogins
                },
                registrationTypes: {
                    email: usersEmailOnly,
                    social: usersWithOAuth
                },
                dateRange: {
                    from: startDate && !isNaN(startDate.getTime()) ? startDate.toISOString() : null,
                    to: !isNaN(endDate.getTime()) ? endDate.toISOString() : now.toISOString()
                }
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error desconocido';
            logger.error(`[AdminController] Error al obtener estadísticas: ${message}`);
            res.status(500).json({ error: 'Error interno al consultar estadísticas' });
        }
    }

    /**
     * Obtiene los logs de inicio de sesión con soporte de filtros multicliente y búsqueda por email.
     * @param req - Objeto de solicitud Express con clientId, email, status y limit en query params.
     * @param res - Objeto de respuesta Express.
     */
    async getLogs(req: Request, res: Response): Promise<void> {
        try {
            const clientId = req.query.clientId as string | undefined;
            const email = req.query.email as string | undefined;
            const status = req.query.status as 'SUCCESS' | 'FAILED' | undefined;
            const limit = Math.min(Number(req.query.limit) || 100, 200);

            const whereClause: Prisma.LoginLogWhereInput = {};

            if (clientId && clientId !== 'all') {
                whereClause.clientId = clientId;
            }

            if (status) {
                whereClause.status = status;
            }

            if (email && email.trim() !== '') {
                whereClause.user = {
                    email: {
                        contains: email.trim(),
                        mode: 'insensitive'
                    }
                };
            }

            const logs = await prisma.loginLog.findMany({
                where: whereClause,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true
                        }
                    },
                    client: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            });

            res.status(200).json(logs);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error desconocido';
            logger.error(`[AdminController] Error al consultar logs: ${message}`);
            res.status(500).json({ error: 'Error interno al consultar logs de auditoría' });
        }
    }

    /**
     * Obtiene el listado de usuarios con soporte de filtros multicliente, búsqueda por email y límite.
     * Ordenados cronológicamente desde los más recientes primero.
     * @param req - Objeto de solicitud Express con clientId, email y limit en query params.
     * @param res - Objeto de respuesta Express.
     */
    async getUsers(req: Request, res: Response): Promise<void> {
        try {
            const clientId = req.query.clientId as string | undefined;
            const email = req.query.email as string | undefined;
            const limit = Math.min(Number(req.query.limit) || 50, 200);

            const whereClause: Prisma.UserWhereInput = {};

            if (clientId && clientId !== 'all') {
                whereClause.clientId = clientId;
            }

            if (email && email.trim() !== '') {
                whereClause.email = {
                    contains: email.trim(),
                    mode: 'insensitive'
                };
            }

            const users = await prisma.user.findMany({
                where: whereClause,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    clientId: true,
                    passwordHash: true,
                    mfaEnabled: true,
                    createdAt: true,
                    updatedAt: true,
                    passwordChangedAt: true,
                    client: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    oauthProviders: {
                        select: {
                            provider: true
                        }
                    },
                    loginLogs: {
                        where: { status: 'SUCCESS' },
                        take: 1,
                        orderBy: { createdAt: 'desc' },
                        select: {
                            createdAt: true
                        }
                    }
                }
            });

            // Mapear resultado seguro sin hashes ni secretos
            const formattedUsers = users.map(u => ({
                id: u.id,
                email: u.email,
                clientId: u.clientId,
                clientName: u.client?.name || 'NexusAuth Directo',
                mfaEnabled: u.mfaEnabled,
                createdAt: u.createdAt,
                updatedAt: u.updatedAt,
                passwordChangedAt: u.passwordChangedAt,
                lastLoginAt: u.loginLogs[0]?.createdAt || null,
                oauthProviders: u.oauthProviders.map(p => p.provider),
                hasPassword: Boolean(u.passwordHash)
            }));

            res.status(200).json(formattedUsers);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error desconocido';
            logger.error(`[AdminController] Error al consultar usuarios: ${message}`);
            res.status(500).json({ error: 'Error interno al consultar el directorio de usuarios' });
        }
    }

    /**
     * Reinicia el factor de doble autenticación (MFA/2FA) de un usuario específico.
     * Remueve el secreto TOTP cifrado y desactiva mfaEnabled.
     * @param req - Objeto de solicitud Express con el ID del usuario en params.
     * @param res - Objeto de respuesta Express.
     */
    async resetUserMfa(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.params.id;

            if (!userId) {
                res.status(400).json({ error: 'El identificador de usuario es requerido' });
                return;
            }

            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { id: true, email: true, mfaEnabled: true }
            });

            if (!user) {
                res.status(404).json({ error: 'Usuario no encontrado' });
                return;
            }

            // Actualizar usuario removiendo el secreto y desactivando MFA
            await prisma.user.update({
                where: { id: userId },
                data: {
                    mfaEnabled: false,
                    mfaSecret: null
                }
            });

            logger.info(`[AdminController.resetUserMfa] MFA reiniciado exitosamente para el usuario: ${user.email} (ID: ${user.id})`);

            res.status(200).json({
                success: true,
                message: `Factor de doble autenticación (MFA) reiniciado exitosamente para ${user.email}`
            });
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Error desconocido';
            logger.error(`[AdminController] Error al reiniciar MFA: ${message}`);
            res.status(500).json({ error: 'Error interno al reiniciar el factor de doble autenticación' });
        }
    }
}
