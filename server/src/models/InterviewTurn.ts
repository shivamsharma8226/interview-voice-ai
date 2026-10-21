import mongoose, { Document, Schema } from 'mongoose';

export interface IInterviewTurn extends Document {
  interviewId: mongoose.Types.ObjectId;
  questionId: mongoose.Types.ObjectId;
  role: 'interviewer' | 'candidate';
  text: string;
  intent?: string;
  createdAt: Date;
}

const InterviewTurnSchema = new Schema<IInterviewTurn>(
  {
    interviewId: { type: Schema.Types.ObjectId, ref: 'Interview', required: true, index: true },
    questionId: { type: Schema.Types.ObjectId, ref: 'InterviewQuestion', required: true },
    role: { type: String, enum: ['interviewer', 'candidate'], required: true },
    text: { type: String, required: true, trim: true },
    intent: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const InterviewTurn = mongoose.model<IInterviewTurn>('InterviewTurn', InterviewTurnSchema);
