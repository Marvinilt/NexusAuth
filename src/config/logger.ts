import winston from 'winston';
import { config } from './env';

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
        new winston.transports.Console()
    ],
});
