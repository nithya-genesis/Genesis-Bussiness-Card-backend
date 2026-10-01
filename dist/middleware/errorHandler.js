"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
function errorHandler(err, req, res, next) {
    console.error('[Error Occurred]:', err);
    if (err instanceof zod_1.ZodError) {
        const formattedErrors = err.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
        }));
        res.status(400).json({
            success: false,
            message: 'Validation failed on input data',
            code: 'VALIDATION_ERROR',
            errors: formattedErrors,
        });
        return;
    }
    const statusCode = err.statusCode || 500;
    const message = err.message || 'An internal server error occurred';
    res.status(statusCode).json({
        success: false,
        message,
        code: err.code || 'INTERNAL_SERVER_ERROR',
    });
}
