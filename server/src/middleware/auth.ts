import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'archive-platform-dev-secret-key-2024';
const JWT_EXPIRES_IN = '24h';

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

/** 必须登录 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: '请先登录' } });
    return;
  }

  try {
    req.user = verifyToken(authHeader.slice(7));
    next();
  } catch {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Token 无效或已过期' } });
  }
}

/** 可选登录（token 无效不报错） */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    try {
      req.user = verifyToken(authHeader.slice(7));
    } catch { /* ignore */ }
  }
  next();
}

/** 限制管理员（内置 token 验证 + 角色检查） */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  // 先验证 token（复用 requireAuth 逻辑）
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: '请先登录' } });
    return;
  }
  try {
    req.user = verifyToken(authHeader.slice(7));
  } catch {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Token 无效或已过期' } });
    return;
  }

  // 再检查角色
  if (req.user.role !== 'admin') {
    res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: '仅管理员可操作' } });
    return;
  }
  next();
}

export { JWT_SECRET, JWT_EXPIRES_IN };
