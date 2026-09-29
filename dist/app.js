"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const index_js_1 = __importDefault(require("./routes/index.js"));
const rateLimiter_js_1 = require("./middleware/rateLimiter.js");
const errorHandler_js_1 = require("./middleware/errorHandler.js");
exports.app = (0, express_1.default)();
// Security Middlewares
exports.app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
exports.app.use((0, cors_1.default)({
    origin: '*', // Allows local dev frontend and mobile browsers
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Request Logger
exports.app.use((0, morgan_1.default)('dev'));
// Body Parser
exports.app.use(express_1.default.json({ limit: '10mb' }));
exports.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Global Rate Limiter
exports.app.use('/api', rateLimiter_js_1.apiLimiter);
// Health check endpoint
exports.app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'genesis-business-card-backend',
    });
});
// API Routes
exports.app.use('/api', index_js_1.default);
// 404 Handler
exports.app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Endpoint ${req.method} ${req.originalUrl} not found`,
        code: 'ROUTE_NOT_FOUND',
    });
});
// Centralized Error Handler
exports.app.use(errorHandler_js_1.errorHandler);
