"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecoveryController = void 0;
const recovery_service_1 = require("../services/recovery.service");
const logger_1 = require("../config/logger");
const recoveryService = new recovery_service_1.RecoveryService();
class RecoveryController {
    async sendEmail(req, res) {
        try {
            const { email } = req.body;
            if (!email) {
                res.status(400).json({ error: 'Email is required' });
                return;
            }
            // Await is handled inside, but we always return 200 so we do not
            // expose whether the email exists in the database.
            await recoveryService.sendRecoveryEmail(email);
            res.status(200).json({ message: 'If the email exists, a recovery link has been sent' });
        }
        catch (error) {
            logger_1.logger.error(`Recovery Email Error: ${error.message}`);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    async resetPassword(req, res) {
        try {
            const { token, newPassword } = req.body;
            if (!token || !newPassword) {
                res.status(400).json({ error: 'Token and new password are required' });
                return;
            }
            const result = await recoveryService.resetPassword(token, newPassword);
            res.status(200).json(result);
        }
        catch (error) {
            res.status(400).json({ error: error.message || 'Error occurred during reset password' });
        }
    }
}
exports.RecoveryController = RecoveryController;
