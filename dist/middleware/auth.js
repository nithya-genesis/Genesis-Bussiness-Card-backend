"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.authorize = authorize;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_js_1 = require("../config/index.js");
const prisma_js_1 = require("../models/prisma.js");
function normalizeRole(role) {
    if (role === 'ADMIN' || role === 'SYSTEM_ADMIN')
        return 'SYSTEM_ADMIN';
    if (role === 'BD_MANAGER')
        return 'BD_MANAGER';
    return 'BD_EXECUTIVE';
}
/**
 * Middleware to authenticate requests via JWT Bearer token
 */
async function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
            success: false,
            message: 'Your session has expired or authentication token is missing. Please sign in again.',
            code: 'AUTH_TOKEN_MISSING',
        });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, index_js_1.config.jwtSecret);
        const user = await prisma_js_1.prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, email: true, role: true, fullName: true, status: true },
        });
        if (!user || user.status !== 'ACTIVE') {
            res.status(401).json({
                success: false,
                message: 'User account not found or is currently inactive',
                code: 'USER_INACTIVE_OR_NOT_FOUND',
            });
            return;
        }
        req.user = {
            id: user.id,
            userId: user.id,
            email: user.email,
            role: normalizeRole(user.role),
            fullName: user.fullName,
        };
        next();
    }
    catch (err) {
        res.status(401).json({
            success: false,
            message: 'Invalid or expired session token. Please sign in again.',
            code: 'AUTH_TOKEN_INVALID',
        });
    }
}
/**
 * Middleware to enforce Role-Based Access Control (RBAC)
 */
function authorize(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentication required',
                code: 'AUTH_REQUIRED',
            });
            return;
        }
        const userRole = normalizeRole(req.user.role);
        const normalizedAllowed = allowedRoles.map(r => normalizeRole(r));
        if (!normalizedAllowed.includes(userRole)) {
            res.status(403).json({
                success: false,
                message: `Forbidden: role '${req.user.role}' lacks sufficient privileges for this operation`,
                code: 'FORBIDDEN_INSUFFICIENT_ROLE',
            });
            return;
        }
        next();
    };
}
