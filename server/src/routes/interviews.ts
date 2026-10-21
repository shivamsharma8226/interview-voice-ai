import { Router } from 'express';
import { InterviewController } from '../controllers/interviewController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post('/', InterviewController.create);
router.get('/', InterviewController.list);
router.get('/:id', InterviewController.getById);
router.post('/:id/start', InterviewController.start);
router.post('/:id/answers', InterviewController.submitAnswer);
router.post('/:id/chat', InterviewController.chat);
router.post('/:id/pause', InterviewController.pause);
router.post('/:id/resume', InterviewController.resume);
router.post('/:id/complete', InterviewController.complete);
router.get('/:id/report', InterviewController.getReport);
router.post('/:id/retry-weak-questions', InterviewController.retryWeakQuestions);
router.delete('/:id', InterviewController.delete);

export default router;
