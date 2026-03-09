import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from './config/logger';
import authRoutes from './routes/auth.routes';
import mfaRoutes from './routes/mfa.routes';
import recoveryRoutes from './routes/recovery.routes';
import passport from 'passport';
import { configurePassport } from './config/passport';

const app: Application = express();

configurePassport();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// Basic healthcheck route
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', message: 'NexusAuth is running' });
});

// Routes
app.use('/auth', authRoutes);
app.use('/mfa', mfaRoutes);
app.use('/recovery', recoveryRoutes);

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error(`Error processing request ${req.method} ${req.originalUrl}: ${err.message}`);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
});

export default app;
