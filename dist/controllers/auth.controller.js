"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const logger_1 = require("../config/logger");
const jwt_1 = require("../utils/jwt");
const authService = new auth_service_1.AuthService();
class AuthController {
    async register(req, res) {
        try {
            const { email, password } = req.body;
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
            if (!email || !password) {
                res.status(400).json({ error: 'Email and password are required' });
                return;
            }
            const result = await authService.login(email, password);
            res.status(200).json(result);
        }
        catch (error) {
            if (error.message === 'Invalid credentials') {
                res.status(401).json({ error: error.message });
            }
            else {
                logger_1.logger.error(`Login error: ${error.message}`);
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    }
    oauthCallback(req, res) {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication failed' });
            return;
        }
        const authUser = req.user;
        if (authUser.mfaEnabled) {
            const payload = { userId: authUser.id, email: authUser.email, mfaPending: true };
            const mfaToken = (0, jwt_1.generateToken)(payload, '5m');
            res.status(200).json({ mfaRequired: true, mfaToken, message: 'MFA verification required' });
            return;
        }
        const payload = { userId: authUser.id, email: authUser.email };
        const token = (0, jwt_1.generateToken)(payload);
        res.status(200).json({ token, user: { id: authUser.id, email: authUser.email } });
    }
}
exports.AuthController = AuthController;
