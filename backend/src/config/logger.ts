import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { config } from './env';

const logDir = path.resolve(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.printf(
        (info) => `[${info.timestamp}] ${info.level.toUpperCase()}: ${info.message}`
    )
);

export const logger = winston.createLogger({
    level: config.nodeEnv === 'development' ? 'debug' : 'info',
    format,
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ 
            filename: path.join(logDir, 'app.log'),
            maxsize: 5242880,
            maxFiles: 3,
        }),
        new winston.transports.File({ 
            filename: path.join(logDir, 'error.log'),
            level: 'error',
            maxsize: 5242880,
            maxFiles: 3,
        }),
    ],
});

// Evitar que errores en la escritura de logs (ej. bloqueos de archivo en Windows) tiren el servidor silenciosamente
logger.on('error', (err) => {
    console.error('Error interno en Winston logger:', err);
});
