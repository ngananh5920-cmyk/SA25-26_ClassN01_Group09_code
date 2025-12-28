import mongoose, { Document, Schema } from 'mongoose';

export interface ITraining extends Document {
  title: string;
  description: string;
  type: 'internal' | 'external' | 'online' | 'workshop';
  instructor?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  maxParticipants?: number;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  createdBy: mongoose.Types.ObjectId;
}

export interface ITrainingEnrollment extends Document {
  training: mongoose.Types.ObjectId;
  employee: mongoose.Types.ObjectId;
  enrolledDate: Date;
  status: 'enrolled' | 'attending' | 'completed' | 'dropped';
  progress?: number; // 0-100
  certificate?: string; // URL to certificate file
  score?: number;
  notes?: string;
}

const trainingSchema = new Schema<ITraining>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['internal', 'external', 'online', 'workshop'],
      required: true,
    },
    instructor: {
      type: String,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
    },
    maxParticipants: {
      type: Number,
      min: 1,
    },
    status: {
      type: String,
      enum: ['scheduled', 'ongoing', 'completed', 'cancelled'],
      default: 'scheduled',
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

const trainingEnrollmentSchema = new Schema<ITrainingEnrollment>(
  {
    training: {
      type: Schema.Types.ObjectId,
      ref: 'Training',
      required: true,
    },
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    enrolledDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['enrolled', 'attending', 'completed', 'dropped'],
      default: 'enrolled',
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    certificate: {
      type: String,
    },
    score: {
      type: Number,
      min: 0,
      max: 100,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

trainingSchema.index({ status: 1, startDate: 1 });
trainingEnrollmentSchema.index({ training: 1, employee: 1 }, { unique: true });
trainingEnrollmentSchema.index({ employee: 1, status: 1 });

export const Training = mongoose.model<ITraining>('Training', trainingSchema);
export const TrainingEnrollment = mongoose.model<ITrainingEnrollment>('TrainingEnrollment', trainingEnrollmentSchema);

