import http from 'http';
import app from './app';
import { logger } from './config/logger';
import { config } from './config/env';

const server = http.createServer(app);

server.listen(config.port, () => {
    logger.info(`NexusAuth server running on port ${config.port} in ${config.nodeEnv} mode`);
});

const gracefulShutdown = () => {
    logger.info('Shutting down gracefully...');
    server.close(() => {
        logger.info('Closed out remaining connections.');
        process.exit(0);
    });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
