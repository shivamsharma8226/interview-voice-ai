import { Router, Request, Response } from 'express';
import { AIService } from '../services/aiService.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/status', (_req: Request, res: Response) => {
  const status = AIService.getStatus();
  res.status(200).json({
    success: true,
    data: status,
  });
});

router.post('/test-connection', authenticate, async (_req: Request, res: Response) => {
  try {
    const status = AIService.getStatus();
    if (status.isLocalFallbackActive) {
      res.status(200).json({
        success: true,
        message: 'Intelligent Local Engine is active and ready for fast, cost-free evaluations.',
        mode: 'local',
      });
      return;
    }

    // Attempt a light ping test with the external provider
    const sample = await AIService.generateQuestions({
      targetRole: 'Software Engineer',
      interviewType: 'technical',
      experienceLevel: 'mid-level',
      difficulty: 'easy',
      totalQuestions: 1,
    });

    res.status(200).json({
      success: true,
      message: `Successfully connected to external AI provider (${status.provider}).`,
      sampleQuestion: sample[0]?.questionText,
    });
  } catch (err: any) {
    res.status(502).json({
      success: false,
      message: `AI provider connection test failed: ${err.message}`,
    });
  }
});

export default router;
