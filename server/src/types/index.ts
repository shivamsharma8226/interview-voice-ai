import { z } from 'zod';

export const CandidateSkillSchema = z.object({
  name: z.string(),
  evidence: z.string(),
  confidence: z.number().min(0).max(1),
});

export const CandidateProjectSchema = z.object({
  name: z.string(),
  description: z.string(),
  technologies: z.array(z.string()),
  claimsToVerify: z.array(z.string()).default([]),
});

export const CandidateExperienceSchema = z.object({
  role: z.string(),
  company: z.string(),
  duration: z.string().optional().default(''),
  keyResponsibilities: z.array(z.string()).default([]),
});

export const CandidateEducationSchema = z.object({
  degree: z.string(),
  institution: z.string(),
  year: z.string().optional().default(''),
});

export const CandidateProfileSchema = z.object({
  experienceLevel: z.enum(['entry', 'mid-level', 'senior', 'lead']).default('mid-level'),
  targetSkills: z.array(z.string()).default([]),
  skills: z.array(CandidateSkillSchema).default([]),
  projects: z.array(CandidateProjectSchema).default([]),
  experience: z.array(CandidateExperienceSchema).default([]),
  education: z.array(CandidateEducationSchema).default([]),
  potentialQuestionAreas: z.array(z.string()).default([]),
});

export type CandidateProfile = z.infer<typeof CandidateProfileSchema>;

export const EvaluationRubricSchema = z.object({
  criteria: z.array(z.string()),
  keyConceptsExpected: z.array(z.string()),
  targetSkill: z.string(),
});

export type EvaluationRubric = z.infer<typeof EvaluationRubricSchema>;

export const QuestionItemSchema = z.object({
  questionText: z.string(),
  category: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  evaluationRubric: EvaluationRubricSchema,
});

export type QuestionItem = z.infer<typeof QuestionItemSchema>;

export const AnswerEvaluationSchema = z.object({
  score: z.number().min(0).max(10),
  maxScore: z.number().default(10),
  verdict: z.enum(['correct', 'partially_correct', 'incorrect', 'incomplete']),
  summary: z.string(),
  strengths: z.array(z.string()),
  mistakes: z.array(z.string()),
  missingConcepts: z.array(z.string()),
  evidenceFromAnswer: z.array(z.string()),
  improvedAnswer: z.string(),
  followUpRecommended: z.boolean(),
  followUpQuestion: z.string().optional(),
  confidence: z.number().min(0).max(1),
});

export type AnswerEvaluation = z.infer<typeof AnswerEvaluationSchema>;

export const SkillScoreSchema = z.object({
  skill: z.string(),
  score: z.number().min(0).max(100),
  maxScore: z.number().default(100),
  feedback: z.string(),
});

export const StudyPlanDaySchema = z.object({
  day: z.number(),
  focusTopic: z.string(),
  exercises: z.array(z.string()),
  keyTakeaway: z.string(),
});

export const FinalReportSchema = z.object({
  overallScore: z.number().min(0).max(100),
  performanceSummary: z.string(),
  skillScores: z.array(SkillScoreSchema),
  communicationFeedback: z.object({
    clarityScore: z.number().min(0).max(100),
    structureScore: z.number().min(0).max(100),
    concisenessScore: z.number().min(0).max(100),
    strengths: z.array(z.string()),
    improvements: z.array(z.string()),
  }),
  strongPoints: z.array(z.string()),
  weakAreas: z.array(z.string()),
  resumeCredibilityFeedback: z.string(),
  studyPlan: z.array(StudyPlanDaySchema),
});

export type FinalReport = z.infer<typeof FinalReportSchema>;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export type InterviewState =
  | 'created'
  | 'preparing'
  | 'ready'
  | 'asking'
  | 'listening'
  | 'evaluating'
  | 'follow_up'
  | 'paused'
  | 'completed'
  | 'failed';

export const ConversationTurnSchema = z.object({
  intent: z.enum(['answer', 'clarification', 'discussion', 'repeat', 'hint', 'skip', 'unclear']),
  reply: z.string().default(''),
  answerComplete: z.boolean().default(false),
});
export type ConversationTurn = z.infer<typeof ConversationTurnSchema>;
