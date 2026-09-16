import http from 'http';
import app from './app';
import { logger } from './config/logger';
import { config } from './config/env';

const server = http.createServer(app);

server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
        logger.error(`Port ${config.port} is in use, retrying in 1s...`);
        setTimeout(() => {
            server.close();
            server.listen(config.port);
        }, 1000);
    } else {
        logger.error(`[SERVER_ERROR] ${err.message}`, { stack: err.stack });
    }
});

server.listen(config.port, () => {
    logger.info(`NexusAuth server running on port ${config.port} in ${config.nodeEnv} mode`);
});

const gracefulShutdown = () => {
    logger.info('Shutting down gracefully...');
    if (typeof server.closeAllConnections === 'function') {
        server.closeAllConnections();
    }
    server.close(() => {
        logger.info('Closed out remaining connections.');
        process.exit(0);
    });
    setTimeout(() => {
        logger.info('Forcing process exit.');
        process.exit(0);
    }, 1500).unref();
};

// En producción, realizar apagado graceful de conexiones.
// En desarrollo, ts-node-dev gestiona los ciclos de vida de reinicio automáticamente.
if (process.env.NODE_ENV === 'production') {
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
}

process.on('uncaughtException', (err: Error) => {
    logger.error(`[UNCAUGHT_EXCEPTION] ${err.message}`, { stack: err.stack });
});

process.on('unhandledRejection', (reason: unknown) => {
    const message = reason instanceof Error ? `${reason.message}\n${reason.stack}` : String(reason);
    logger.error(`[UNHANDLED_REJECTION] ${message}`);
});
