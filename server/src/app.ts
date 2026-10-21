import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';
import { config } from './config/env.js';

import authRoutes from './routes/auth.js';
import resumeRoutes from './routes/resumes.js';
import interviewRoutes from './routes/interviews.js';
import aiRoutes from './routes/ai.js';
import voiceRoutes from './routes/voice.js';

export const createApp = () => {
  const app = express();

  // Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Let Next.js frontend handle CSP
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // CORS Configuration
  const allowedOrigins = [
    config.frontendUrl,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(null, true); // Permissive in dev, or set to false in strict prod
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Body Parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Global Rate Limiter
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 600, // Limit each IP to 600 requests per 15 mins
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests from this IP, please try again later.' },
  });
  app.use('/api', limiter);

  // Request logger (safe, no secret leakage)
  app.use((req, _res, next) => {
    if (config.nodeEnv !== 'test') {
      const sanitizedUrl = req.originalUrl.split('?')[0];
      console.log(`[HTTP] ${req.method} ${sanitizedUrl}`);
    }
    next();
  });

  // Health Check Endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: 'InterviewAI API Server',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      aiEngine: config.llmProvider,
    });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/resumes', resumeRoutes);
  app.use('/api/interviews', interviewRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/voice', voiceRoutes);

  // 404 Route Handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ success: false, message: 'Endpoint not found' });
  });

  // Centralized Error Handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    if (config.nodeEnv !== 'test') {
      console.error('[App Error Handler]:', err);
    }

    // Multer file upload errors
    if (err.name === 'MulterError') {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({ success: false, message: 'File is too large. Maximum allowed size is 10MB.' });
        return;
      }
      res.status(400).json({ success: false, message: `File upload error: ${err.message}` });
      return;
    }

    // AI Provider Error
    if (err.name === 'AIProviderError') {
      res.status(err.statusCode || 502).json({
        success: false,
        message: err.message,
        provider: err.provider,
      });
      return;
    }

    // Mongoose Duplicate Key Error
    if (err.code === 11000) {
      res.status(409).json({ success: false, message: 'Duplicate record already exists.' });
      return;
    }

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
      success: false,
      message,
      ...(config.nodeEnv === 'development' ? { stack: err.stack } : {}),
    });
  });

  return app;
};
