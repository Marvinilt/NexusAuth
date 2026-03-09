"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const logger_1 = require("./config/logger");
const env_1 = require("./config/env");
const server = http_1.default.createServer(app_1.default);
server.listen(env_1.config.port, () => {
    logger_1.logger.info(`NexusAuth server running on port ${env_1.config.port} in ${env_1.config.nodeEnv} mode`);
});
const gracefulShutdown = () => {
    logger_1.logger.info('Shutting down gracefully...');
    server.close(() => {
        logger_1.logger.info('Closed out remaining connections.');
        process.exit(0);
    });
};
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
