import mongoose, { Document, Schema } from 'mongoose';
import { FinalReport, InterviewState } from '../types/index.js';

export interface IInterviewConfiguration {
  durationMinutes: number;
  totalQuestions: number;
  focusSkills: string[];
  allowFollowUps: boolean;
  voiceMode: boolean;
  jobDescription?: string;
}

export interface IInterview extends Document {
  userId: mongoose.Types.ObjectId;
  resumeId?: mongoose.Types.ObjectId;
  targetRole: string;
  experienceLevel: 'entry' | 'mid-level' | 'senior' | 'lead';
  interviewType: 'technical' | 'hr' | 'behavioral' | 'system_design' | 'coding' | 'fullstack' | 'custom';
  difficulty: 'easy' | 'medium' | 'hard';
  configuration: IInterviewConfiguration;
  state: InterviewState;
  currentQuestionIndex: number;
  startedAt?: Date;
  pausedAt?: Date;
  completedAt?: Date;
  overallScore?: number;
  report?: FinalReport;
  createdAt: Date;
  updatedAt: Date;
}

const InterviewSchema = new Schema<IInterview>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    resumeId: {
      type: Schema.Types.ObjectId,
      ref: 'Resume',
    },
    targetRole: {
      type: String,
      required: true,
      trim: true,
    },
    experienceLevel: {
      type: String,
      enum: ['entry', 'mid-level', 'senior', 'lead'],
      default: 'mid-level',
    },
    interviewType: {
      type: String,
      enum: ['technical', 'hr', 'behavioral', 'system_design', 'coding', 'fullstack', 'custom'],
      default: 'technical',
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    configuration: {
      durationMinutes: { type: Number, default: 20 },
      totalQuestions: { type: Number, default: 5 },
      focusSkills: { type: [String], default: [] },
      allowFollowUps: { type: Boolean, default: true },
      voiceMode: { type: Boolean, default: true },
      jobDescription: { type: String, default: '' },
    },
    state: {
      type: String,
      enum: [
        'created',
        'preparing',
        'ready',
        'asking',
        'listening',
        'evaluating',
        'follow_up',
        'paused',
        'completed',
        'failed',
      ],
      default: 'created',
      index: true,
    },
    currentQuestionIndex: {
      type: Number,
      default: 0,
    },
    startedAt: {
      type: Date,
    },
    pausedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    overallScore: {
      type: Number,
    },
    report: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

InterviewSchema.index({ userId: 1, createdAt: -1 });

export const Interview = mongoose.model<IInterview>('Interview', InterviewSchema);
