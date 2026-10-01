import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../models/prisma.js';
import { config } from '../config/index.js';
import { loginSchema, createUserSchema, updateUserSchema } from '../validators/index.js';
import { logAuditEvent } from '../services/auditService.js';

export class AuthController {
  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = loginSchema.parse(req.body);
      const user = await prisma.user.findUnique({
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

      const isPasswordValid = await bcrypt.compare(validated.password, user.passwordHash);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Invalid email or password',
          code: 'AUTH_FAILED',
        });
        return;
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        config.jwtSecret,
        { expiresIn: '7d' }
      );

      await logAuditEvent({
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
    } catch (err) {
      next(err);
    }
  }

  public static async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const user = await prisma.user.findUnique({
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
    } catch (err) {
      next(err);
    }
  }

  public static async listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await prisma.user.findMany({
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
    } catch (err) {
      next(err);
    }
  }

  public static async createUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = createUserSchema.parse(req.body);

      const existing = await prisma.user.findUnique({
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

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(validated.password, salt);

      const newUser = await prisma.user.create({
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

      await logAuditEvent({
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
    } catch (err) {
      next(err);
    }
  }

  public static async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const validated = updateUserSchema.parse(req.body);

      const existingUser = await prisma.user.findUnique({ where: { id } });
      if (!existingUser) {
        res.status(404).json({ success: false, message: 'User not found' });
        return;
      }

      const updateData: any = {};
      if (validated.fullName) updateData.fullName = validated.fullName;
      if (validated.phone !== undefined) updateData.phone = validated.phone;
      if (validated.role) updateData.role = validated.role;
      if (validated.status) updateData.status = validated.status;
      if (validated.password) {
        const salt = await bcrypt.genSalt(10);
        updateData.passwordHash = await bcrypt.hash(validated.password, salt);
      }

      const updated = await prisma.user.update({
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

      await logAuditEvent({
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
    } catch (err) {
      next(err);
    }
  }
}
