"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mfaPendingRequired = exports.authRequired = void 0;
const jwt_1 = require("../utils/jwt");
const logger_1 = require("../config/logger");
const authRequired = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        res.status(401).json({ error: 'No authorization header provided' });
        return;
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({ error: 'Token missing from authorization header' });
        return;
    }
    try {
        const decoded = (0, jwt_1.verifyToken)(token);
        req.user = decoded; // Contains userId and email
        next();
    }
    catch (error) {
        logger_1.logger.warn(`Auth Error: ${error.message}`);
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};
exports.authRequired = authRequired;
const mfaPendingRequired = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        res.status(401).json({ error: 'No authorization header provided' });
        return;
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({ error: 'Token missing from authorization header' });
        return;
    }
    try {
        const decoded = (0, jwt_1.verifyToken)(token);
        if (!decoded.mfaPending) {
            res.status(403).json({ error: 'Token is fully authenticated, not pending MFA' });
            return;
        }
        req.user = decoded;
        next();
    }
    catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};
exports.mfaPendingRequired = mfaPendingRequired;
