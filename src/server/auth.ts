import type { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import { getDatabase } from './db.ts';
import type { User, UserRole } from '../types/index.ts';

const TOKEN_SECRET = process.env.AUTH_SECRET || 'oshesh_secret_key_bangladesh_2026';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function createAuthToken(user: User): string {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    iat: Date.now(),
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', TOKEN_SECRET).update(data).digest('base64url');
  return `${data}.${signature}`;
}

export function verifyAuthToken(token: string): { sub: string; email: string; role: UserRole } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [data, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', TOKEN_SECRET).update(data).digest('base64url');
    if (expectedSig !== signature) return null;

    const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf-8'));
    if (payload.exp && Date.now() > payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
}

export function authenticateUser(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.substring(7).trim();
  const decoded = verifyAuthToken(token);
  if (!decoded) {
    return next();
  }

  const db = getDatabase();
  const user = db.users.find((u) => u.id === decoded.sub);
  if (user) {
    req.user = user;
  }
  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'লগইন প্রয়োজন (Authentication required)' });
    return;
  }
  next();
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'লগইন প্রয়োজন (Authentication required)' });
      return;
    }

    // Super admin has universal access
    if (req.user.role === 'super_admin' || allowedRoles.includes(req.user.role)) {
      return next();
    }

    res.status(403).json({
      error: 'আপনার এই অংশে প্রবেশের অনুমতি নেই (Insufficient permissions)'
    });
  };
}
