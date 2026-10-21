import mongoose, { Document, Schema } from 'mongoose';
import { AnswerEvaluation } from '../types/index.js';

export interface IInterviewAnswer extends Document {
  interviewId: mongoose.Types.ObjectId;
  questionId: mongoose.Types.ObjectId;
  transcript: string;
  durationSeconds: number;
  score: number;
  maxScore: number;
  evaluation: AnswerEvaluation;
  createdAt: Date;
  updatedAt: Date;
}

const InterviewAnswerSchema = new Schema<IInterviewAnswer>(
  {
    interviewId: {
      type: Schema.Types.ObjectId,
      ref: 'Interview',
      required: true,
      index: true,
    },
    questionId: {
      type: Schema.Types.ObjectId,
      ref: 'InterviewQuestion',
      required: true,
      index: true,
    },
    transcript: {
      type: String,
      required: true,
      trim: true,
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    score: {
      type: Number,
      required: true,
    },
    maxScore: {
      type: Number,
      default: 10,
    },
    evaluation: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

InterviewAnswerSchema.index({ interviewId: 1, questionId: 1 }, { unique: true });

export const InterviewAnswer = mongoose.model<IInterviewAnswer>('InterviewAnswer', InterviewAnswerSchema);
