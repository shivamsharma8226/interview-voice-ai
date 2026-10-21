import { Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { Interview, IInterview } from '../models/Interview.js';
import { InterviewQuestion, IInterviewQuestion } from '../models/InterviewQuestion.js';
import { InterviewAnswer } from '../models/InterviewAnswer.js';
import { Resume } from '../models/Resume.js';
import { AIService } from '../services/aiService.js';
import { CandidateProfile } from '../types/index.js';

const CreateInterviewSchema = z.object({
  resumeId: z.string().optional(),
  targetRole: z.string().min(2, 'Target role is required'),
  experienceLevel: z.enum(['entry', 'mid-level', 'senior', 'lead']).default('mid-level'),
  interviewType: z.enum(['technical', 'hr', 'behavioral', 'system_design', 'coding', 'fullstack', 'custom']).default('technical'),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  configuration: z.object({
    durationMinutes: z.number().min(5).max(120).default(20),
    totalQuestions: z.number().min(1).max(15).default(5),
    focusSkills: z.array(z.string()).default([]),
    allowFollowUps: z.boolean().default(true),
    voiceMode: z.boolean().default(true),
    jobDescription: z.string().optional().default(''),
  }).default({
    durationMinutes: 20,
    totalQuestions: 5,
    focusSkills: [],
    allowFollowUps: true,
    voiceMode: true,
    jobDescription: '',
  }),
});

const SubmitAnswerSchema = z.object({
  questionId: z.string().min(1, 'Question ID is required'),
  transcript: z.string().min(1, 'Answer transcript cannot be empty'),
  durationSeconds: z.number().min(0).default(0),
});

export class InterviewController {
  /**
   * Create a new interview session and generate tailored questions
   */
  public static async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const parsed = CreateInterviewSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: parsed.error.errors[0]?.message || 'Invalid interview configuration',
          errors: parsed.error.errors,
        });
        return;
      }

      const { resumeId, targetRole, experienceLevel, interviewType, difficulty, configuration } = parsed.data;

      let candidateProfile: CandidateProfile | undefined;
      let resumeDoc = null;

      if (resumeId) {
        resumeDoc = await Resume.findOne({ _id: resumeId, userId: req.user.id });
        if (resumeDoc) {
          candidateProfile = resumeDoc.parsedProfile;
        }
      }

      // Generate realistic questions via AI Service
      const generatedQuestions = await AIService.generateQuestions({
        candidateProfile,
        targetRole,
        interviewType,
        experienceLevel,
        difficulty,
        totalQuestions: configuration.totalQuestions,
        focusSkills: configuration.focusSkills,
        jobDescription: configuration.jobDescription,
      });

      // Create Interview document
      const interview = await Interview.create({
        userId: req.user.id,
        resumeId: resumeDoc ? resumeDoc._id : undefined,
        targetRole,
        experienceLevel,
        interviewType,
        difficulty,
        configuration,
        state: 'created',
        currentQuestionIndex: 0,
      });

      // Save questions to database
      const questionDocs = await InterviewQuestion.insertMany(
        generatedQuestions.map((q, index) => ({
          interviewId: interview._id,
          questionText: q.questionText,
          category: q.category,
          difficulty: q.difficulty,
          evaluationRubric: q.evaluationRubric,
          order: index + 1,
          isFollowUp: false,
        }))
      );

      res.status(201).json({
        success: true,
        message: 'Interview created successfully',
        data: {
          interview,
          questionsCount: questionDocs.length,
          firstQuestion: questionDocs[0],
        },
      });
    } catch (error: any) {
      console.error('[InterviewController.create] Error:', error);
      res.status(500).json({ success: false, message: `Failed to create interview: ${error.message}` });
    }
  }

  /**
   * List all interviews for current user with filtering
   */
  public static async list(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { category, state, limit = '20', page = '1' } = req.query;
      const query: any = { userId: req.user.id };

      if (category && typeof category === 'string' && category !== 'all') {
        query.interviewType = category;
      }

      if (state && typeof state === 'string' && state !== 'all') {
        query.state = state;
      }

      const pageNum = Math.max(1, parseInt(page as string, 10));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
      const skip = (pageNum - 1) * limitNum;

      const [interviews, total] = await Promise.all([
        Interview.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNum)
          .select('-report'), // Exclude full report from list
        Interview.countDocuments(query),
      ]);

      res.status(200).json({
        success: true,
        data: {
          interviews,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            pages: Math.ceil(total / limitNum),
          },
        },
      });
    } catch (error: any) {
      console.error('[InterviewController.list] Error:', error);
      res.status(500).json({ success: false, message: 'Server error fetching interviews' });
    }
  }

  /**
   * Get single interview session with state-aware redaction
   */
  public static async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const interview = await Interview.findOne({ _id: id, userId: req.user.id });

      if (!interview) {
        res.status(404).json({ success: false, message: 'Interview session not found' });
        return;
      }

      // Fetch questions ordered
      const questions = await InterviewQuestion.find({ interviewId: interview._id }).sort({ order: 1 });
      const answers = await InterviewAnswer.find({ interviewId: interview._id });

      // Realistic interview mode security:
      // If interview is in-progress, do not leak rubric answers or scores to candidate!
      const isCompleted = interview.state === 'completed';
      const sanitizedQuestions = questions.map(q => {
        const qObj = q.toObject();
        if (!isCompleted) {
          // Hide rubric details and keyConcepts during realistic interview
          delete (qObj as any).evaluationRubric;
        }
        return qObj;
      });

      const sanitizedAnswers = answers.map(a => {
        const aObj = a.toObject();
        if (!isCompleted) {
          // Hide score and evaluation during live interview
          delete (aObj as any).score;
          delete (aObj as any).evaluation;
        }
        return aObj;
      });

      res.status(200).json({
        success: true,
        data: {
          interview,
          questions: sanitizedQuestions,
          answers: sanitizedAnswers,
          currentQuestion: questions[interview.currentQuestionIndex] || null,
        },
      });
    } catch (error: any) {
      console.error('[InterviewController.getById] Error:', error);
      res.status(500).json({ success: false, message: 'Server error fetching interview' });
    }
  }

  /**
   * Start or resume interview session
   */
  public static async start(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const interview = await Interview.findOne({ _id: id, userId: req.user.id });

      if (!interview) {
        res.status(404).json({ success: false, message: 'Interview session not found' });
        return;
      }

      if (interview.state === 'completed') {
        res.status(400).json({ success: false, message: 'Interview is already completed' });
        return;
      }

      const questions = await InterviewQuestion.find({ interviewId: interview._id }).sort({ order: 1 });
      if (questions.length === 0) {
        res.status(400).json({ success: false, message: 'No questions prepared for this interview' });
        return;
      }

      if (!interview.startedAt) {
        interview.startedAt = new Date();
      }

      interview.state = 'asking';
      await interview.save();

      const activeQuestion = questions[interview.currentQuestionIndex] || questions[0];

      res.status(200).json({
        success: true,
        message: 'Interview started',
        data: {
          interview,
          currentQuestion: {
            _id: activeQuestion._id,
            questionText: activeQuestion.questionText,
            category: activeQuestion.category,
            difficulty: activeQuestion.difficulty,
            order: activeQuestion.order,
            isFollowUp: activeQuestion.isFollowUp,
          },
          totalQuestions: questions.length,
          currentIndex: interview.currentQuestionIndex,
        },
      });
    } catch (error: any) {
      console.error('[InterviewController.start] Error:', error);
      res.status(500).json({ success: false, message: 'Server error starting interview' });
    }
  }

  /**
   * Submit answer for current question
   */
  public static async submitAnswer(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const parsed = SubmitAnswerSchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          success: false,
          message: parsed.error.errors[0]?.message || 'Invalid answer payload',
        });
        return;
      }

      const { questionId, transcript, durationSeconds } = parsed.data;

      const interview = await Interview.findOne({ _id: id, userId: req.user.id });
      if (!interview) {
        res.status(404).json({ success: false, message: 'Interview session not found' });
        return;
      }

      if (interview.state === 'completed') {
        res.status(400).json({ success: false, message: 'Interview has already completed' });
        return;
      }

      // Check for duplicate submission
      const existingAnswer = await InterviewAnswer.findOne({
        interviewId: interview._id,
        questionId: new mongoose.Types.ObjectId(questionId),
      });

      if (existingAnswer) {
        res.status(409).json({
          success: false,
          message: 'An answer has already been submitted for this question.',
        });
        return;
      }

      const question = await InterviewQuestion.findOne({
        _id: questionId,
        interviewId: interview._id,
      });

      if (!question) {
        res.status(404).json({ success: false, message: 'Question does not belong to this interview' });
        return;
      }

      // Evaluate answer via AI Service
      interview.state = 'evaluating';
      await interview.save();

      const evaluation = await AIService.evaluateAnswer({
        questionText: question.questionText,
        category: question.category,
        difficulty: question.difficulty,
        evaluationRubric: question.evaluationRubric,
        transcript,
        targetRole: interview.targetRole,
        interviewType: interview.interviewType,
      });

      // Save answer
      await InterviewAnswer.create({
        interviewId: interview._id,
        questionId: question._id,
        transcript,
        durationSeconds,
        score: evaluation.score,
        maxScore: evaluation.maxScore,
        evaluation,
      });

      // Check if adaptive follow-up question should be created
      const allowFollowUps = interview.configuration.allowFollowUps;
      const existingFollowUps = await InterviewQuestion.countDocuments({
        interviewId: interview._id,
        isFollowUp: true,
      });

      const shouldFollowUp =
        allowFollowUps &&
        !question.isFollowUp &&
        evaluation.followUpRecommended &&
        existingFollowUps < 1; // Limit to 1 adaptive follow-up per session

      const allQuestions = await InterviewQuestion.find({ interviewId: interview._id }).sort({ order: 1 });

      if (shouldFollowUp && allQuestions.length < interview.configuration.totalQuestions + 2) {
        const followUpText = evaluation.followUpQuestion ||
          await AIService.generateFollowUpQuestion({
            questionText: question.questionText,
            transcript,
            evaluation,
            targetRole: interview.targetRole,
          });

        // Insert follow-up right after the current question
        const followUpDoc = await InterviewQuestion.create({
          interviewId: interview._id,
          questionText: followUpText,
          category: question.category,
          difficulty: question.difficulty,
          evaluationRubric: {
            criteria: ['Depth of elaboration', 'Direct resolution of the follow-up prompt'],
            keyConceptsExpected: evaluation.missingConcepts.slice(0, 2),
            targetSkill: question.evaluationRubric.targetSkill,
          },
          order: question.order + 0.1, // Float order right after
          parentQuestionId: question._id,
          isFollowUp: true,
        });

        // Re-query questions with new follow-up
        const updatedQuestions = await InterviewQuestion.find({ interviewId: interview._id }).sort({ order: 1 });
        const nextIndex = updatedQuestions.findIndex(q => q._id.toString() === followUpDoc._id.toString());
        
        interview.currentQuestionIndex = nextIndex;
        interview.state = 'follow_up';
        await interview.save();

        res.status(200).json({
          success: true,
          message: 'Follow-up question triggered',
          data: {
            isCompleted: false,
            isFollowUp: true,
            currentIndex: nextIndex,
            totalQuestions: updatedQuestions.length,
            nextQuestion: {
              _id: followUpDoc._id,
              questionText: followUpDoc.questionText,
              category: followUpDoc.category,
              difficulty: followUpDoc.difficulty,
              order: followUpDoc.order,
              isFollowUp: true,
            },
          },
        });
        return;
      }

      // Check if more questions remain
      const nextIndex = interview.currentQuestionIndex + 1;
      if (nextIndex < allQuestions.length) {
        interview.currentQuestionIndex = nextIndex;
        interview.state = 'asking';
        await interview.save();

        const nextQuestion = allQuestions[nextIndex];
        res.status(200).json({
          success: true,
          message: 'Answer saved, proceeding to next question',
          data: {
            isCompleted: false,
            isFollowUp: false,
            currentIndex: nextIndex,
            totalQuestions: allQuestions.length,
            nextQuestion: {
              _id: nextQuestion._id,
              questionText: nextQuestion.questionText,
              category: nextQuestion.category,
              difficulty: nextQuestion.difficulty,
              order: nextQuestion.order,
              isFollowUp: nextQuestion.isFollowUp,
            },
          },
        });
        return;
      }

      // All questions completed! Generate final performance report
      await InterviewController.finalizeInterview(interview);

      res.status(200).json({
        success: true,
        message: 'Interview completed! Final report generated.',
        data: {
          isCompleted: true,
          interviewId: interview._id,
          overallScore: interview.overallScore,
        },
      });
    } catch (error: any) {
      console.error('[InterviewController.submitAnswer] Error:', error);
      res.status(500).json({ success: false, message: `Failed to submit answer: ${error.message}` });
    }
  }

  /**
   * Pause ongoing interview
   */
  public static async pause(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const interview = await Interview.findOneAndUpdate(
        { _id: id, userId: req.user.id },
        { $set: { state: 'paused', pausedAt: new Date() } },
        { new: true }
      );

      if (!interview) {
        res.status(404).json({ success: false, message: 'Interview session not found' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Interview paused',
        data: { interview },
      });
    } catch (error: any) {
      console.error('[InterviewController.pause] Error:', error);
      res.status(500).json({ success: false, message: 'Server error pausing interview' });
    }
  }

  /**
   * Resume paused interview
   */
  public static async resume(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const interview = await Interview.findOneAndUpdate(
        { _id: id, userId: req.user.id },
        { $set: { state: 'asking' } },
        { new: true }
      );

      if (!interview) {
        res.status(404).json({ success: false, message: 'Interview session not found' });
        return;
      }

      const questions = await InterviewQuestion.find({ interviewId: interview._id }).sort({ order: 1 });
      const currentQuestion = questions[interview.currentQuestionIndex] || questions[0];

      res.status(200).json({
        success: true,
        message: 'Interview resumed',
        data: {
          interview,
          currentQuestion,
        },
      });
    } catch (error: any) {
      console.error('[InterviewController.resume] Error:', error);
      res.status(500).json({ success: false, message: 'Server error resuming interview' });
    }
  }

  /**
   * Complete interview manually early and generate report for answered questions
   */
  public static async complete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const interview = await Interview.findOne({ _id: id, userId: req.user.id });

      if (!interview) {
        res.status(404).json({ success: false, message: 'Interview session not found' });
        return;
      }

      await InterviewController.finalizeInterview(interview);

      res.status(200).json({
        success: true,
        message: 'Interview finalized successfully',
        data: {
          interviewId: interview._id,
          overallScore: interview.overallScore,
          report: interview.report,
        },
      });
    } catch (error: any) {
      console.error('[InterviewController.complete] Error:', error);
      res.status(500).json({ success: false, message: 'Server error completing interview' });
    }
  }

  /**
   * Get comprehensive final report
   */
  public static async getReport(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const interview = await Interview.findOne({ _id: id, userId: req.user.id });

      if (!interview) {
        res.status(404).json({ success: false, message: 'Interview session not found' });
        return;
      }

      if (interview.state !== 'completed') {
        res.status(400).json({
          success: false,
          message: 'Report is only available once the interview has been completed.',
        });
        return;
      }

      const questions = await InterviewQuestion.find({ interviewId: interview._id }).sort({ order: 1 });
      const answers = await InterviewAnswer.find({ interviewId: interview._id });

      const qaPairs = questions.map(q => {
        const ans = answers.find(a => a.questionId.toString() === q._id.toString());
        return {
          question: q,
          answer: ans || null,
        };
      });

      res.status(200).json({
        success: true,
        data: {
          interview,
          report: interview.report,
          qaPairs,
        },
      });
    } catch (error: any) {
      console.error('[InterviewController.getReport] Error:', error);
      res.status(500).json({ success: false, message: 'Server error fetching report' });
    }
  }

  /**
   * Retry weak questions (< 7 score) in a new targeted practice session
   */
  public static async retryWeakQuestions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const originalInterview = await Interview.findOne({ _id: id, userId: req.user.id });

      if (!originalInterview) {
        res.status(404).json({ success: false, message: 'Original interview session not found' });
        return;
      }

      const answers = await InterviewAnswer.find({ interviewId: originalInterview._id });
      let weakAnswers = answers.filter(a => a.score < 7);

      // If no answers were below 7, take the lowest scoring ones
      if (weakAnswers.length === 0 && answers.length > 0) {
        weakAnswers = [...answers].sort((a, b) => a.score - b.score).slice(0, 3);
      }

      const questionIds = weakAnswers.map(a => a.questionId);
      const weakQuestions = await InterviewQuestion.find({ _id: { $in: questionIds } });

      if (weakQuestions.length === 0) {
        res.status(400).json({ success: false, message: 'No questions found to retry.' });
        return;
      }

      // Create new targeted practice interview
      const retryInterview = await Interview.create({
        userId: req.user.id,
        resumeId: originalInterview.resumeId,
        targetRole: `${originalInterview.targetRole} (Weak Areas Drill)`,
        experienceLevel: originalInterview.experienceLevel,
        interviewType: originalInterview.interviewType,
        difficulty: originalInterview.difficulty,
        configuration: {
          ...originalInterview.configuration,
          totalQuestions: weakQuestions.length,
        },
        state: 'created',
        currentQuestionIndex: 0,
      });

      // Clone questions into new interview
      await InterviewQuestion.insertMany(
        weakQuestions.map((q, idx) => ({
          interviewId: retryInterview._id,
          questionText: q.questionText,
          category: q.category,
          difficulty: q.difficulty,
          evaluationRubric: q.evaluationRubric,
          order: idx + 1,
          isFollowUp: false,
        }))
      );

      res.status(201).json({
        success: true,
        message: 'Created targeted retry interview for weak areas',
        data: {
          newInterviewId: retryInterview._id,
        },
      });
    } catch (error: any) {
      console.error('[InterviewController.retryWeakQuestions] Error:', error);
      res.status(500).json({ success: false, message: 'Server error retrying weak questions' });
    }
  }

  /**
   * Delete interview session
   */
  public static async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const interview = await Interview.findOneAndDelete({ _id: id, userId: req.user.id });

      if (!interview) {
        res.status(404).json({ success: false, message: 'Interview session not found' });
        return;
      }

      // Clean up child collections
      await Promise.all([
        InterviewQuestion.deleteMany({ interviewId: interview._id }),
        InterviewAnswer.deleteMany({ interviewId: interview._id }),
      ]);

      res.status(200).json({
        success: true,
        message: 'Interview session and associated data deleted successfully',
      });
    } catch (error: any) {
      console.error('[InterviewController.delete] Error:', error);
      res.status(500).json({ success: false, message: 'Server error deleting interview' });
    }
  }

  /**
   * Private helper to finalize an interview and generate the comprehensive report
   */
  private static async finalizeInterview(interview: IInterview): Promise<void> {
    const questions = await InterviewQuestion.find({ interviewId: interview._id }).sort({ order: 1 });
    const answers = await InterviewAnswer.find({ interviewId: interview._id });

    // Build questionsWithAnswers
    const questionsWithAnswers = questions
      .map(q => {
        const a = answers.find(ans => ans.questionId.toString() === q._id.toString());
        if (!a) return null;
        return {
          questionText: q.questionText,
          category: q.category,
          targetSkill: q.evaluationRubric?.targetSkill || 'Technical Competence',
          transcript: a.transcript,
          score: a.score,
          evaluation: a.evaluation,
        };
      })
      .filter(Boolean) as any[];

    let report;
    let overallScore = 0;

    if (questionsWithAnswers.length > 0) {
      report = await AIService.generateFinalReport({
        targetRole: interview.targetRole,
        interviewType: interview.interviewType,
        experienceLevel: interview.experienceLevel,
        questionsWithAnswers,
      });
      overallScore = report.overallScore;
    } else {
      overallScore = 0;
      report = {
        overallScore: 0,
        performanceSummary: 'Interview ended with no questions answered.',
        skillScores: [],
        communicationFeedback: {
          clarityScore: 0,
          structureScore: 0,
          concisenessScore: 0,
          strengths: [],
          improvements: ['Complete at least one question to receive communication feedback.'],
        },
        strongPoints: [],
        weakAreas: ['No answers provided.'],
        resumeCredibilityFeedback: 'Not enough data to assess.',
        studyPlan: [],
      };
    }

    interview.state = 'completed';
    interview.completedAt = new Date();
    interview.overallScore = overallScore;
    interview.report = report;
    await interview.save();
  }
}
