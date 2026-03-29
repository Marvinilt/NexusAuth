"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MfaController = void 0;
const mfa_service_1 = require("../services/mfa.service");
const logger_1 = require("../config/logger");
const jwt_1 = require("../utils/jwt");
const auth_service_1 = require("../services/auth.service");
const mfaService = new mfa_service_1.MfaService();
const authService = new auth_service_1.AuthService();
class MfaController {
    async setup(req, res) {
        try {
            const user = req.user;
            const data = await mfaService.generateSetupData(user.userId, user.email);
            res.status(200).json(data);
        }
        catch (error) {
            logger_1.logger.error(`MFA Setup Error: ${error.message}`);
            res.status(500).json({ error: 'Failed to setup MFA' });
        }
    }
    async verify(req, res) {
        try {
            const user = req.user;
            const { token } = req.body;
            if (!token) {
                res.status(400).json({ error: 'Token is required' });
                return;
            }
            const result = await mfaService.verifyAndEnable(user.userId, token);
            logger_1.logger.info(`USER_MFA_ACTIVATED: User ${user.userId} enabled 2FA`);
            res.status(200).json(result);
        }
        catch (error) {
            logger_1.logger.info(`AUTH_INVALID_TOTP: MFA Setup verify failed for user ${req.user?.userId}`);
            res.status(400).json({ error: error.message });
        }
    }
    async loginVerify(req, res) {
        try {
            const user = req.user;
            const { token } = req.body;
            if (!token) {
                res.status(400).json({ error: 'Token is required' });
                return;
            }
            const isValid = await mfaService.verifyLoginToken(user.userId, token);
            if (!isValid)
                throw new Error('Invalid MFA token');
            const ipAddress = req.ip || req.socket.remoteAddress;
            const userAgent = req.headers['user-agent'] || 'Unknown';
            const lastLoginAt = await authService.logUserLogin(user.userId, {
                status: 'SUCCESS',
                ipAddress,
                userAgent
            });
            const payload = { userId: user.userId, email: user.email };
            const fullToken = (0, jwt_1.generateToken)(payload);
            res.status(200).json({ token: fullToken, user: { id: user.userId, email: user.email, lastLoginAt } });
        }
        catch (error) {
            const user = req.user;
            logger_1.logger.info(`AUTH_MFA_FAILED: Login failed for user ${user?.userId}. Error: ${error.message}`);
            try {
                if (user && user.userId) {
                    await authService.logUserLogin(user.userId, {
                        status: 'FAILED',
                        ipAddress: req.ip || req.socket.remoteAddress,
                        userAgent: req.headers['user-agent'] || 'Unknown'
                    });
                }
            }
            catch (logErr) {
                logger_1.logger.error(`Failed to log failed MFA metadata: ${logErr}`);
            }
            res.status(401).json({ error: error.message || 'Invalid or expired token' });
        }
    }
}
exports.MfaController = MfaController;
