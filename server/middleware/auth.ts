import { Request, Response, NextFunction } from 'express';
import { verifyJWT } from '../utils/auth.js';
import { getConnection } from '../config/database.js';
import { logger } from '../utils/logger.js';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    [key: string]: any;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = verifyJWT(token);
      
      // Verify user still exists in database
      const connection = getConnection();
      
      let user;
      switch (decoded.role) {
        case 'user':
          [user] = await connection.execute(
            'SELECT id, email, role, is_verified FROM users WHERE id = ? AND is_verified = TRUE',
            [decoded.id]
          );
          break;
        case 'coordinator':
          [user] = await connection.execute(
            'SELECT id, email, role, is_verified, is_approved FROM coordinators WHERE id = ? AND is_verified = TRUE AND is_approved = TRUE',
            [decoded.id]
          );
          break;
        case 'company':
          [user] = await connection.execute(
            'SELECT id, email, role, is_verified, is_approved FROM companies WHERE id = ? AND is_verified = TRUE AND is_approved = TRUE',
            [decoded.id]
          );
          break;
        case 'admin':
          [user] = await connection.execute(
            'SELECT id, email, role, is_verified, is_approved FROM admins WHERE id = ? AND is_verified = TRUE AND is_approved = TRUE',
            [decoded.id]
          );
          break;
        default:
          return res.status(401).json({ message: 'Invalid user role' });
      }

      if (!user || (user as any[]).length === 0) {
        return res.status(401).json({ message: 'User not found or not authorized' });
      }

      req.user = (user as any[])[0];
      next();
    } catch (jwtError) {
      logger.warn('Invalid JWT token:', jwtError);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    return res.status(500).json({ message: 'Authentication error' });
  }
};

// Special authentication for admin profile completion - allows verified but not approved admins
export const authenticateForProfileCompletion = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void | Response> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = verifyJWT(token);
      
      // Verify user exists and is verified (but don't require approval for admins)
      const connection = getConnection();
      
      let user;
      switch (decoded.role) {
        case 'user':
          [user] = await connection.execute(
            'SELECT id, email, role, is_verified FROM users WHERE id = ? AND is_verified = TRUE',
            [decoded.id]
          );
          break;
        case 'coordinator':
          [user] = await connection.execute(
            'SELECT id, email, role, is_verified, is_approved FROM coordinators WHERE id = ? AND is_verified = TRUE',
            [decoded.id]
          );
          break;
        case 'company':
          [user] = await connection.execute(
            'SELECT id, email, role, is_verified, is_approved FROM companies WHERE id = ? AND is_verified = TRUE',
            [decoded.id]
          );
          break;
        case 'admin':
          // For admin profile completion, only require verification, not approval
          [user] = await connection.execute(
            'SELECT id, email, role, is_verified, is_approved FROM admins WHERE id = ? AND is_verified = TRUE',
            [decoded.id]
          );
          break;
        default:
          return res.status(401).json({ message: 'Invalid user role' });
      }

      if (!user || (user as any[]).length === 0) {
        return res.status(401).json({ message: 'User not found or not verified' });
      }

      req.user = (user as any[])[0];
      next();
    } catch (jwtError) {
      logger.warn('Invalid JWT token:', jwtError);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    return res.status(500).json({ message: 'Authentication error' });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void | Response => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // Continue without authentication
  }

  try {
    await authenticate(req, res, next);
  } catch (error) {
    // If authentication fails, continue without user data
    next();
  }
};
