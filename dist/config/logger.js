"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const env_1 = require("./env");
const format = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }), winston_1.default.format.printf((info) => `[${info.timestamp}] ${info.level.toUpperCase()}: ${info.message}`));
exports.logger = winston_1.default.createLogger({
    level: env_1.config.nodeEnv === 'development' ? 'debug' : 'info',
    format,
    transports: [
        new winston_1.default.transports.Console()
    ],
});
