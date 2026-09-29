import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { prisma } from '../models/prisma.js';

export type UserRole = 'SYSTEM_ADMIN' | 'BD_MANAGER' | 'BD_EXECUTIVE';

export interface AuthenticatedUser {
  id: string;
  userId: string;
  email: string;
  role: UserRole;
  fullName: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

function normalizeRole(role: string): UserRole {
  if (role === 'ADMIN' || role === 'SYSTEM_ADMIN') return 'SYSTEM_ADMIN';
  if (role === 'BD_MANAGER') return 'BD_MANAGER';
  return 'BD_EXECUTIVE';
}

/**
 * Middleware to authenticate requests via JWT Bearer token
 */
export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
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
    const decoded = jwt.verify(token, config.jwtSecret) as {
      id: string;
      email: string;
      role: string;
    };

    const user = await prisma.user.findUnique({
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
  } catch (err) {
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
export function authorize(...allowedRoles: Array<UserRole>) {
  return (req: Request, res: Response, next: NextFunction): void => {
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
