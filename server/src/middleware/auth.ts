import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { User, IUser } from '../models/User.js';
import { AuthUser } from '../types/index.js';

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export const generateToken = (user: IUser): string => {
  return jwt.sign(
    {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    },
    config.jwtSecret,
    { expiresIn: '7d' }
  );
};

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.headers.cookie) {
      const match = req.headers.cookie.match(/(?:^|;\s*)token=([^;]+)/);
      if (match) {
        token = match[1];
      }
    }

    if (!token) {
      res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
      return;
    }

    const decoded = jwt.verify(token, config.jwtSecret) as { id: string; name: string; email: string };
    
    // Check if user still exists in DB
    const user = await User.findById(decoded.id).select('_id name email');
    if (!user) {
      res.status(401).json({ success: false, message: 'User belonging to this token no longer exists.' });
      return;
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    };

    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};
