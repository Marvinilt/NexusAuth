"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const logger_1 = require("./config/logger");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const mfa_routes_1 = __importDefault(require("./routes/mfa.routes"));
const recovery_routes_1 = __importDefault(require("./routes/recovery.routes"));
const passport_1 = __importDefault(require("passport"));
const passport_2 = require("./config/passport");
const app = (0, express_1.default)();
(0, passport_2.configurePassport)();
// Middlewares
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(passport_1.default.initialize());
// Basic healthcheck route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'NexusAuth is running' });
});
// Routes
app.use('/auth', auth_routes_1.default);
app.use('/mfa', mfa_routes_1.default);
app.use('/recovery', recovery_routes_1.default);
// Error handling middleware
app.use((err, req, res, next) => {
    logger_1.logger.error(`Error processing request ${req.method} ${req.originalUrl}: ${err.message}`);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
});
exports.default = app;
