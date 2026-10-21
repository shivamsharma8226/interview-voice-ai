import mongoose, { Document, Schema } from 'mongoose';
import { EvaluationRubric } from '../types/index.js';

export interface IInterviewQuestion extends Document {
  interviewId: mongoose.Types.ObjectId;
  questionText: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  evaluationRubric: EvaluationRubric;
  order: number;
  parentQuestionId?: mongoose.Types.ObjectId;
  isFollowUp: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const InterviewQuestionSchema = new Schema<IInterviewQuestion>(
  {
    interviewId: {
      type: Schema.Types.ObjectId,
      ref: 'Interview',
      required: true,
      index: true,
    },
    questionText: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    evaluationRubric: {
      criteria: { type: [String], default: [] },
      keyConceptsExpected: { type: [String], default: [] },
      targetSkill: { type: String, default: 'General' },
    },
    order: {
      type: Number,
      required: true,
    },
    parentQuestionId: {
      type: Schema.Types.ObjectId,
      ref: 'InterviewQuestion',
      default: null,
    },
    isFollowUp: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

InterviewQuestionSchema.index({ interviewId: 1, order: 1 });

export const InterviewQuestion = mongoose.model<IInterviewQuestion>('InterviewQuestion', InterviewQuestionSchema);
