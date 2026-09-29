"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_js_1 = require("../models/prisma.js");
const index_js_1 = require("../config/index.js");
const index_js_2 = require("../validators/index.js");
const auditService_js_1 = require("../services/auditService.js");
class AuthController {
    static async login(req, res, next) {
        try {
            const validated = index_js_2.loginSchema.parse(req.body);
            const user = await prisma_js_1.prisma.user.findUnique({
                where: { email: validated.email.toLowerCase() },
            });
            if (!user || user.status !== 'ACTIVE') {
                res.status(401).json({
                    success: false,
                    message: 'Invalid email or password',
                    code: 'AUTH_FAILED',
                });
                return;
            }
            const isPasswordValid = await bcryptjs_1.default.compare(validated.password, user.passwordHash);
            if (!isPasswordValid) {
                res.status(401).json({
                    success: false,
                    message: 'Invalid email or password',
                    code: 'AUTH_FAILED',
                });
                return;
            }
            const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, index_js_1.config.jwtSecret, { expiresIn: '7d' });
            await (0, auditService_js_1.logAuditEvent)({
                userId: user.id,
                action: 'USER_LOGIN',
                entity: 'AUTH',
                entityId: user.id,
                newValue: { email: user.email, role: user.role },
                ipAddress: req.ip,
                userAgent: req.get('user-agent') || undefined,
            });
            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: {
                    token,
                    user: {
                        id: user.id,
                        email: user.email,
                        fullName: user.fullName,
                        role: user.role,
                        phone: user.phone,
                    },
                },
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async me(req, res, next) {
        try {
            if (!req.user) {
                res.status(401).json({ success: false, message: 'Unauthorized' });
                return;
            }
            const user = await prisma_js_1.prisma.user.findUnique({
                where: { id: req.user.id },
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    role: true,
                    phone: true,
                    status: true,
                    createdAt: true,
                },
            });
            if (!user) {
                res.status(404).json({ success: false, message: 'User not found' });
                return;
            }
            res.status(200).json({
                success: true,
                data: user,
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async listUsers(req, res, next) {
        try {
            const users = await prisma_js_1.prisma.user.findMany({
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    role: true,
                    phone: true,
                    status: true,
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
            });
            res.status(200).json({
                success: true,
                data: users,
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async createUser(req, res, next) {
        try {
            const validated = index_js_2.createUserSchema.parse(req.body);
            const existing = await prisma_js_1.prisma.user.findUnique({
                where: { email: validated.email.toLowerCase() },
            });
            if (existing) {
                res.status(409).json({
                    success: false,
                    message: 'A user with this email already exists.',
                    code: 'EMAIL_ALREADY_EXISTS',
                });
                return;
            }
            const salt = await bcryptjs_1.default.genSalt(10);
            const passwordHash = await bcryptjs_1.default.hash(validated.password, salt);
            const newUser = await prisma_js_1.prisma.user.create({
                data: {
                    email: validated.email.toLowerCase(),
                    passwordHash,
                    fullName: validated.fullName,
                    phone: validated.phone || null,
                    role: validated.role,
                },
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    role: true,
                    phone: true,
                    status: true,
                    createdAt: true,
                },
            });
            await (0, auditService_js_1.logAuditEvent)({
                userId: req.user?.id,
                action: 'USER_CREATED',
                entity: 'USER',
                entityId: newUser.id,
                newValue: { email: newUser.email, role: newUser.role, fullName: newUser.fullName },
                ipAddress: req.ip,
                userAgent: req.get('user-agent') || undefined,
            });
            res.status(201).json({
                success: true,
                message: 'User created successfully',
                data: newUser,
            });
        }
        catch (err) {
            next(err);
        }
    }
    static async updateUser(req, res, next) {
        try {
            const id = String(req.params.id);
            const validated = index_js_2.updateUserSchema.parse(req.body);
            const existingUser = await prisma_js_1.prisma.user.findUnique({ where: { id } });
            if (!existingUser) {
                res.status(404).json({ success: false, message: 'User not found' });
                return;
            }
            const updateData = {};
            if (validated.fullName)
                updateData.fullName = validated.fullName;
            if (validated.phone !== undefined)
                updateData.phone = validated.phone;
            if (validated.role)
                updateData.role = validated.role;
            if (validated.status)
                updateData.status = validated.status;
            if (validated.password) {
                const salt = await bcryptjs_1.default.genSalt(10);
                updateData.passwordHash = await bcryptjs_1.default.hash(validated.password, salt);
            }
            const updated = await prisma_js_1.prisma.user.update({
                where: { id },
                data: updateData,
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    role: true,
                    phone: true,
                    status: true,
                    updatedAt: true,
                },
            });
            await (0, auditService_js_1.logAuditEvent)({
                userId: req.user?.id,
                action: 'USER_UPDATED',
                entity: 'USER',
                entityId: updated.id,
                oldValue: { role: existingUser.role, status: existingUser.status },
                newValue: updateData,
                ipAddress: req.ip,
                userAgent: req.get('user-agent') || undefined,
            });
            res.status(200).json({
                success: true,
                message: 'User updated successfully',
                data: updated,
            });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.AuthController = AuthController;
