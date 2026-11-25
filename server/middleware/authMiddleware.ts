import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/store';
import { IUserDocument } from '../db/schema';
import { UserRole } from '../../src/types';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: IUserDocument;
    }
  }
}

const JWT_SECRET =
  process.env.JWT_SECRET ||
  'unimart-dev-fallback-secret-change-in-production-min-32-chars';

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.warn('[Auth] WARNING: JWT_SECRET is not set in production environment!');
}

export interface JwtPayload {
  userId: string;
  role: UserRole;
}

export function signAuthToken(userId: string, role: UserRole, rememberMe = false): string {
  return jwt.sign({ userId, role }, JWT_SECRET, {
    expiresIn: rememberMe ? '30d' : '7d',
  });
}

export function verifyAuthToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (decoded && typeof decoded.userId === 'string') {
      return decoded;
    }
    return null;
  } catch {
    return null;
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    let userId: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      if (token) {
        const payload = verifyAuthToken(token);
        userId = payload?.userId;
      }
    }

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required. Please log in to continue.',
      });
      return;
    }

    const user = await db.findUserById(userId);
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User account not found or invalid session.',
      });
      return;
    }

    if (user.status === 'suspended') {
      res.status(403).json({
        success: false,
        error: 'This account has been suspended. Please contact campus administration.',
      });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('[Auth] Middleware error:', err);
    res.status(500).json({ success: false, error: 'Authentication check failed.' });
  }
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      if (token) {
        const payload = verifyAuthToken(token);
        if (payload?.userId) {
          const user = await db.findUserById(payload.userId);
          if (user && user.status !== 'suspended') {
            req.user = user;
          }
        }
      }
    }
  } catch {
    // Ignore optional auth lookup failures
  }
  next();
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required.',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Permission denied. Access restricted to [${allowedRoles.join(', ')}].`,
      });
      return;
    }

    next();
  };
}

export const requireAdmin = requireRole('admin');
export const requireAuth = authenticate;
