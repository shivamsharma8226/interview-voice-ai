import { Router } from 'express';
import { ResumeController } from '../controllers/resumeController.js';
import { authenticate } from '../middleware/auth.js';
import { uploadResume } from '../middleware/upload.js';

const router = Router();

router.use(authenticate);

router.post('/', uploadResume.single('resume'), ResumeController.uploadAndParse);
router.get('/', ResumeController.list);
router.get('/:id', ResumeController.getById);
router.patch('/:id/profile', ResumeController.updateProfile);
router.delete('/:id', ResumeController.delete);

export default router;
