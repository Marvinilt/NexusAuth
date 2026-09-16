import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { prisma } from './config/prisma';
import helmet from 'helmet';
import { logger } from './config/logger';
import authRoutes from './routes/auth.routes';
import mfaRoutes from './routes/mfa.routes';
import recoveryRoutes from './routes/recovery.routes';
import clientRoutes from './routes/client.routes';
import adminRoutes from './routes/admin.routes';
import passport from 'passport';
import { configurePassport } from './config/passport';

const app: Application = express();

configurePassport();

// Middlewares
app.use(helmet());
app.use(cors(async (req, callback) => {
    const origin = req.header('Origin');
    
    // Server-to-Server calls without origin
    if (!origin) return callback(null, { origin: true });

    // En desarrollo, permitir peticiones desde localhost
    if (process.env.NODE_ENV === 'development' && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
        return callback(null, { origin: true });
    }
    
    try {
        const clientWithOrigin = await prisma.client.findFirst({
            where: {
                allowedOrigins: {
                    has: origin
                }
            }
        });
        
        if (clientWithOrigin) {
            callback(null, { origin: true });
        } else {
            callback(new Error('CORS: Origen no autorizado'));
        }
    } catch (e: unknown) {
        callback(e instanceof Error ? e : new Error('CORS Error'));
    }
}));
app.use(express.json());
app.use(passport.initialize());

// HTTP Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info(`[HTTP] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    });
    next();
});

// Basic healthcheck route
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', message: 'NexusAuth is running' });
});

// Routes
app.use('/auth', authRoutes);
app.use('/mfa', mfaRoutes);
app.use('/recovery', recoveryRoutes);
app.use('/clients', clientRoutes);
app.use('/admin', adminRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error(`Error processing request ${req.method} ${req.originalUrl}: ${err.message}`);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
});

export default app;
