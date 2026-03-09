"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MfaController = void 0;
const mfa_service_1 = require("../services/mfa.service");
const logger_1 = require("../config/logger");
const jwt_1 = require("../utils/jwt");
const mfaService = new mfa_service_1.MfaService();
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
            const payload = { userId: user.userId, email: user.email };
            const fullToken = (0, jwt_1.generateToken)(payload);
            res.status(200).json({ token: fullToken, user: { id: user.userId, email: user.email } });
        }
        catch (error) {
            logger_1.logger.info(`AUTH_INVALID_TOTP: Login failed for user ${req.user?.userId}`);
            res.status(401).json({ error: error.message });
        }
    }
}
exports.MfaController = MfaController;
