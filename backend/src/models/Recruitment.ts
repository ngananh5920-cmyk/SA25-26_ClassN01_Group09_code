import mongoose, { Document, Schema } from 'mongoose';

export interface IRecruitment extends Document {
  title: string;
  department: mongoose.Types.ObjectId;
  position: mongoose.Types.ObjectId;
  description: string;
  requirements: string[];
  quantity: number; // Số lượng cần tuyển
  status: 'open' | 'closed' | 'filled';
  postedDate: Date;
  deadline?: Date;
  createdBy: mongoose.Types.ObjectId;
}

export interface ICandidate extends Document {
  recruitment: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  cvFile?: string; // URL to CV file
  coverLetter?: string;
  status: 'applied' | 'screening' | 'interview' | 'offer' | 'rejected' | 'hired';
  interviewDate?: Date;
  interviewNotes?: string;
  rating?: number; // 1-5
  notes?: string;
}

const recruitmentSchema = new Schema<IRecruitment>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    position: {
      type: Schema.Types.ObjectId,
      ref: 'Position',
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    requirements: [String],
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ['open', 'closed', 'filled'],
      default: 'open',
    },
    postedDate: {
      type: Date,
      default: Date.now,
    },
    deadline: {
      type: Date,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const candidateSchema = new Schema<ICandidate>(
  {
    recruitment: {
      type: Schema.Types.ObjectId,
      ref: 'Recruitment',
      required: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
    },
    cvFile: {
      type: String,
    },
    coverLetter: {
      type: String,
    },
    status: {
      type: String,
      enum: ['applied', 'screening', 'interview', 'offer', 'rejected', 'hired'],
      default: 'applied',
    },
    interviewDate: {
      type: Date,
    },
    interviewNotes: {
      type: String,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

recruitmentSchema.index({ status: 1, postedDate: -1 });
candidateSchema.index({ recruitment: 1, status: 1 });

export const Recruitment = mongoose.model<IRecruitment>('Recruitment', recruitmentSchema);
export const Candidate = mongoose.model<ICandidate>('Candidate', candidateSchema);

