import http from 'http';
import app from './app';
import { logger } from './config/logger';
import { config } from './config/env';

const server = http.createServer(app);

server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
        logger.warn(`El puerto ${config.port} se encuentra ocupado. Reintentando en 1.5s...`);
        setTimeout(() => {
            try {
                if (server.listening) {
                    server.close();
                }
            } catch {
                // Ignorar si el servidor aún no estaba escuchando activamente
            }
            server.listen(config.port);
        }, 1500);
    } else {
        logger.error(`[SERVER_ERROR] ${err.message}`, { stack: err.stack });
    }
});

server.listen(config.port, () => {
    logger.info(`NexusAuth server running on port ${config.port} in ${config.nodeEnv} mode`);
});

const gracefulShutdown = (signal: string) => {
    logger.info(`[SHUTDOWN] Señal ${signal} recibida. Cerrando conexiones del servidor...`);
    try {
        if (typeof server.closeAllConnections === 'function') {
            server.closeAllConnections();
        }
    } catch {
        // Ignorar
    }
    server.close(() => {
        logger.info('[SHUTDOWN] Servidor cerrado exitosamente.');
        process.exit(0);
    });
    setTimeout(() => {
        process.exit(0);
    }, 1000).unref();
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.once('SIGUSR2', () => gracefulShutdown('SIGUSR2'));

process.on('uncaughtException', (err: Error) => {
    logger.error(`[UNCAUGHT_EXCEPTION] ${err.message}`, { stack: err.stack });
});

process.on('unhandledRejection', (reason: unknown) => {
    const message = reason instanceof Error ? `${reason.message}\n${reason.stack}` : String(reason);
    logger.error(`[UNHANDLED_REJECTION] ${message}`);
});
