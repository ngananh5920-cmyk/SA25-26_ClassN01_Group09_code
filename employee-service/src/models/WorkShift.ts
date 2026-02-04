import mongoose, { Document, Schema } from 'mongoose';

export interface IWorkShift extends Document {
  name: string;
  startTime: string; // Format: "HH:mm"
  endTime: string; // Format: "HH:mm"
  breakDuration: number; // minutes
  description?: string;
  status: 'active' | 'inactive';
}

const workShiftSchema = new Schema<IWorkShift>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    startTime: {
      type: String,
      required: true,
      match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/,
    },
    endTime: {
      type: String,
      required: true,
      match: /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/,
    },
    breakDuration: {
      type: Number,
      default: 0,
      min: 0,
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IWorkShift>('WorkShift', workShiftSchema);


