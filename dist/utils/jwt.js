"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const logger_1 = require("../config/logger");
const generateToken = (payload, expiresIn = env_1.config.jwtExpiresIn) => {
    return jsonwebtoken_1.default.sign(payload, env_1.config.jwtSecret, { expiresIn });
};
exports.generateToken = generateToken;
const verifyToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, env_1.config.jwtSecret);
    }
    catch (error) {
        logger_1.logger.error(`JWT_VERIFY_ERROR: ${error.message} - Token start: ${token ? token.substring(0, 15) : 'null'}`);
        throw new Error('Invalid or expired token');
    }
};
exports.verifyToken = verifyToken;
