import { Response } from 'express';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Resume } from '../models/Resume.js';
import { ResumeParserService } from '../services/resumeParser.js';
import { AIService } from '../services/aiService.js';
import { CandidateProfileSchema } from '../types/index.js';

export class ResumeController {
  public static async uploadAndParse(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      if (!req.file) {
        res.status(400).json({ success: false, message: 'Please upload a PDF or DOCX resume file.' });
        return;
      }

      const filePath = req.file.path;
      const mimeType = req.file.mimetype;
      const originalFilename = req.file.originalname;

      // Extract and sanitize text
      let extractedData;
      try {
        extractedData = await ResumeParserService.extractTextFromFile(filePath, mimeType, originalFilename);
      } catch (parseErr: any) {
        res.status(422).json({
          success: false,
          message: `Failed to process resume file: ${parseErr.message}`,
        });
        return;
      }

      // Analyze candidate profile via AI Service
      let candidateProfile;
      try {
        candidateProfile = await AIService.extractCandidateProfile(extractedData.text);
      } catch (aiErr: any) {
        console.error('[ResumeController] AI extraction error:', aiErr.message);
        res.status(502).json({
          success: false,
          message: `AI resume intelligence failed: ${aiErr.message}`,
        });
        return;
      }

      // Save to database
      const resume = await Resume.create({
        userId: req.user.id,
        originalFilename,
        storageReference: `uploads/${req.file.filename}`,
        extractedText: extractedData.text,
        parsedProfile: candidateProfile,
        processingStatus: 'completed',
      });

      res.status(201).json({
        success: true,
        message: 'Resume uploaded and analyzed successfully',
        data: {
          resume,
        },
      });
    } catch (error: any) {
      console.error('[ResumeController.uploadAndParse] Error:', error);
      res.status(500).json({ success: false, message: 'Internal server error during resume upload' });
    }
  }

  public static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const resumes = await Resume.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .select('-extractedText'); // Exclude huge raw text from listing for efficiency

      res.status(200).json({
        success: true,
        data: {
          resumes,
        },
      });
    } catch (error: any) {
      console.error('[ResumeController.list] Error:', error);
      res.status(500).json({ success: false, message: 'Server error fetching resumes' });
    }
  }

  public static async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) {
        res.status(404).json({ success: false, message: 'Resume not found' });
        return;
      }

      const resume = await Resume.findOne({ _id: id, userId: req.user.id });

      if (!resume) {
        res.status(404).json({ success: false, message: 'Resume not found' });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          resume,
        },
      });
    } catch (error: any) {
      if (error?.name === 'CastError') {
        res.status(404).json({ success: false, message: 'Resume not found' });
        return;
      }
      console.error('[ResumeController.getById] Error:', error);
      res.status(500).json({ success: false, message: 'Server error fetching resume' });
    }
  }

  public static async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) {
        res.status(404).json({ success: false, message: 'Resume not found' });
        return;
      }

      const parsed = CandidateProfileSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: 'Invalid profile data structure',
          errors: parsed.error.errors,
        });
        return;
      }

      const resume = await Resume.findOneAndUpdate(
        { _id: id, userId: req.user.id },
        { $set: { parsedProfile: parsed.data } },
        { new: true }
      );

      if (!resume) {
        res.status(404).json({ success: false, message: 'Resume not found' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Resume candidate profile updated successfully',
        data: {
          resume,
        },
      });
    } catch (error: any) {
      if (error?.name === 'CastError') {
        res.status(404).json({ success: false, message: 'Resume not found' });
        return;
      }
      console.error('[ResumeController.updateProfile] Error:', error);
      res.status(500).json({ success: false, message: 'Server error updating profile' });
    }
  }

  public static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) {
        res.status(404).json({ success: false, message: 'Resume not found' });
        return;
      }

      const resume = await Resume.findOneAndDelete({ _id: id, userId: req.user.id });

      if (!resume) {
        res.status(404).json({ success: false, message: 'Resume not found' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Resume deleted successfully',
      });
    } catch (error: any) {
      if (error?.name === 'CastError') {
        res.status(404).json({ success: false, message: 'Resume not found' });
        return;
      }
      console.error('[ResumeController.delete] Error:', error);
      res.status(500).json({ success: false, message: 'Server error deleting resume' });
    }
  }
}
