import mongoose, { Document, Schema } from 'mongoose';
import { CandidateProfile } from '../types/index.js';

export interface IResume extends Document {
  userId: mongoose.Types.ObjectId;
  originalFilename: string;
  storageReference: string;
  extractedText: string;
  parsedProfile: CandidateProfile;
  processingStatus: 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ResumeSchema = new Schema<IResume>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    originalFilename: {
      type: String,
      required: true,
    },
    storageReference: {
      type: String,
      required: true,
    },
    extractedText: {
      type: String,
      default: '',
    },
    parsedProfile: {
      type: Schema.Types.Mixed,
      default: () => ({
        experienceLevel: 'mid-level',
        targetSkills: [],
        skills: [],
        projects: [],
        experience: [],
        education: [],
        potentialQuestionAreas: [],
      }),
    },
    processingStatus: {
      type: String,
      enum: ['processing', 'completed', 'failed'],
      default: 'processing',
      index: true,
    },
    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

ResumeSchema.index({ userId: 1, createdAt: -1 });

export const Resume = mongoose.model<IResume>('Resume', ResumeSchema);
