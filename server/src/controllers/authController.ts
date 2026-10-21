import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User } from '../models/User.js';
import { generateToken, AuthenticatedRequest } from '../middleware/auth.js';

const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const LoginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export class AuthController {
  public static async register(req: Request, res: Response): Promise<void> {
    try {
      const parsed = RegisterSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: parsed.error.errors[0]?.message || 'Validation error',
          errors: parsed.error.errors,
        });
        return;
      }

      const { name, email, password } = parsed.data;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(409).json({ success: false, message: 'Email is already registered' });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const user = await User.create({
        name,
        email,
        passwordHash,
      });

      const token = generateToken(user);

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          token,
          user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
          },
        },
      });
    } catch (error: any) {
      console.error('[AuthController.register] Error:', error);
      res.status(500).json({ success: false, message: 'Server error during registration' });
    }
  }

  public static async login(req: Request, res: Response): Promise<void> {
    try {
      const parsed = LoginSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: parsed.error.errors[0]?.message || 'Validation error',
        });
        return;
      }

      const { email, password } = parsed.data;

      const user = await User.findOne({ email });
      if (!user) {
        res.status(401).json({ success: false, message: 'Invalid email or password' });
        return;
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        res.status(401).json({ success: false, message: 'Invalid email or password' });
        return;
      }

      const token = generateToken(user);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
          },
        },
      });
    } catch (error: any) {
      console.error('[AuthController.login] Error:', error);
      res.status(500).json({ success: false, message: 'Server error during login' });
    }
  }

  public static async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          user: req.user,
        },
      });
    } catch (error: any) {
      console.error('[AuthController.me] Error:', error);
      res.status(500).json({ success: false, message: 'Server error fetching profile' });
    }
  }

  public static async logout(_req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  }
}
