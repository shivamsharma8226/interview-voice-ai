export interface User {
  id: string;
  name: string;
  email: string;
}

export interface CandidateSkill {
  name: string;
  evidence: string;
  confidence: number;
}

export interface CandidateProject {
  name: string;
  description: string;
  technologies: string[];
  claimsToVerify: string[];
}

export interface CandidateExperience {
  role: string;
  company: string;
  duration?: string;
  keyResponsibilities: string[];
}

export interface CandidateEducation {
  degree: string;
  institution: string;
  year?: string;
}

export interface CandidateProfile {
  experienceLevel: 'entry' | 'mid-level' | 'senior' | 'lead';
  targetSkills: string[];
  skills: CandidateSkill[];
  projects: CandidateProject[];
  experience: CandidateExperience[];
  education: CandidateEducation[];
  potentialQuestionAreas: string[];
}

export interface ResumeItem {
  _id: string;
  originalFilename: string;
  storageReference: string;
  parsedProfile: CandidateProfile;
  processingStatus: 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InterviewConfiguration {
  durationMinutes: number;
  totalQuestions: number;
  focusSkills: string[];
  allowFollowUps: boolean;
  voiceMode: boolean;
  jobDescription?: string;
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

export interface InterviewItem {
  _id: string;
  userId: string;
  resumeId?: string;
  targetRole: string;
  experienceLevel: 'entry' | 'mid-level' | 'senior' | 'lead';
  interviewType: 'technical' | 'hr' | 'behavioral' | 'system_design' | 'coding' | 'fullstack' | 'custom';
  difficulty: 'easy' | 'medium' | 'hard';
  configuration: InterviewConfiguration;
  state: InterviewState;
  currentQuestionIndex: number;
  startedAt?: string;
  pausedAt?: string;
  completedAt?: string;
  overallScore?: number;
  report?: FinalReport;
  createdAt: string;
  updatedAt: string;
}

export interface InterviewQuestionItem {
  _id: string;
  interviewId: string;
  questionText: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  order: number;
  isFollowUp: boolean;
  parentQuestionId?: string;
  evaluationRubric?: {
    criteria: string[];
    keyConceptsExpected: string[];
    targetSkill: string;
  };
}

export interface AnswerEvaluation {
  score: number;
  maxScore: number;
  verdict: 'correct' | 'partially_correct' | 'incorrect' | 'incomplete';
  summary: string;
  strengths: string[];
  mistakes: string[];
  missingConcepts: string[];
  evidenceFromAnswer: string[];
  improvedAnswer: string;
  followUpRecommended: boolean;
  followUpQuestion?: string;
  confidence: number;
}

export interface InterviewAnswerItem {
  _id: string;
  interviewId: string;
  questionId: string;
  transcript: string;
  durationSeconds: number;
  score?: number;
  maxScore?: number;
  evaluation?: AnswerEvaluation;
  createdAt: string;
}

export interface SkillScore {
  skill: string;
  score: number;
  maxScore: number;
  feedback: string;
}

export interface StudyPlanDay {
  day: number;
  focusTopic: string;
  exercises: string[];
  keyTakeaway: string;
}

export interface FinalReport {
  overallScore: number;
  performanceSummary: string;
  skillScores: SkillScore[];
  communicationFeedback: {
    clarityScore: number;
    structureScore: number;
    concisenessScore: number;
    strengths: string[];
    improvements: string[];
  };
  strongPoints: string[];
  weakAreas: string[];
  resumeCredibilityFeedback: string;
  studyPlan: StudyPlanDay[];
}

export interface QAPair {
  question: InterviewQuestionItem;
  answer: InterviewAnswerItem | null;
}
