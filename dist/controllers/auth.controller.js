"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const logger_1 = require("../config/logger");
const jwt_1 = require("../utils/jwt");
const prisma_1 = require("../config/prisma");
const authService = new auth_service_1.AuthService();
class AuthController {
    async register(req, res) {
        try {
            const { email, password } = req.body;
            logger_1.logger.info(`[AuthController.register] Incoming register request for email: ${email}`);
            if (!email || !password) {
                res.status(400).json({ error: 'Email and password are required' });
                return;
            }
            const user = await authService.register(email, password);
            res.status(201).json({ message: 'User registered successfully', user });
        }
        catch (error) {
            if (error.message.includes('already exists') || error.message.includes('Invalid') || error.message.includes('Password must')) {
                res.status(400).json({ error: error.message });
            }
            else {
                logger_1.logger.error(`Registration error: ${error.message}`);
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    }
    async login(req, res) {
        try {
            const { email, password } = req.body;
            logger_1.logger.info(`[AuthController.login] Incoming login request for email: ${email}`);
            if (!email || !password) {
                res.status(400).json({ error: 'Email and password are required' });
                return;
            }
            const result = await authService.login(email, password);
            if (!result.mfaRequired && result.user) {
                const ipAddress = req.ip || req.socket.remoteAddress;
                const userAgent = req.headers['user-agent'] || 'Unknown';
                const lastLoginAt = await authService.logUserLogin(result.user.id, {
                    status: 'SUCCESS',
                    ipAddress,
                    userAgent
                });
                result.user.lastLoginAt = lastLoginAt;
            }
            res.status(200).json(result);
        }
        catch (error) {
            // Log local failure if we can find the user
            try {
                const tempUser = await prisma_1.prisma.user.findUnique({ where: { email: req.body.email } });
                if (tempUser) {
                    await authService.logUserLogin(tempUser.id, {
                        status: 'FAILED',
                        ipAddress: req.ip || req.socket.remoteAddress,
                        userAgent: req.headers['user-agent'] || 'Unknown'
                    });
                }
            }
            catch (logErr) {
                logger_1.logger.error(`Failed to log failed login: ${logErr}`);
            }
            if (error.message === 'Invalid credentials') {
                res.status(401).json({ error: error.message });
            }
            else {
                logger_1.logger.error(`Login error: ${error.message}`);
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    }
    async oauthCallback(req, res) {
        if (!req.user) {
            logger_1.logger.error(`[AuthController.oauthCallback] Authentication failed to return an OAuth user object`);
            res.status(401).json({ error: 'Authentication failed' });
            return;
        }
        const authUser = req.user;
        logger_1.logger.info(`[AuthController.oauthCallback] Handling successful OAuth callback for user: ${authUser.email}`);
        if (authUser.mfaEnabled) {
            const payload = { userId: authUser.id, email: authUser.email, mfaPending: true };
            const mfaToken = (0, jwt_1.generateToken)(payload, '15m');
            // Redirect to frontend's MFA verification page with the temporary token
            res.redirect(`http://localhost:5173/mfa-verify?mfaToken=${mfaToken}`);
            return;
        }
        const ipAddress = req.ip || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'] || 'Unknown';
        const lastLoginAt = await authService.logUserLogin(authUser.id, {
            status: 'SUCCESS',
            ipAddress,
            userAgent
        });
        const payload = { userId: authUser.id, email: authUser.email };
        const token = (0, jwt_1.generateToken)(payload);
        const userData = JSON.stringify({ id: authUser.id, email: authUser.email, lastLoginAt });
        // Redirect to frontend's callback capture page with token and user data
        res.redirect(`http://localhost:5173/oauth/callback?token=${token}&user=${encodeURIComponent(userData)}`);
    }
    async getHistory(req, res) {
        try {
            const user = req.user;
            const history = await authService.getLoginHistory(user.userId);
            res.json(history);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to fetch history' });
        }
    }
}
exports.AuthController = AuthController;
