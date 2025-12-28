import mongoose, { Document, Schema } from 'mongoose';

export interface IPosition extends Document {
  title: string;
  description?: string;
  department: mongoose.Types.ObjectId;
  minSalary?: number;
  maxSalary?: number;
  requirements?: string[];
  status: 'active' | 'inactive';
}

const positionSchema = new Schema<IPosition>(
  {
    title: {
      type: String,
      required: [true, 'Position title is required'],
      trim: true,
    },
    description: {
      type: String,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    minSalary: {
      type: Number,
      min: 0,
    },
    maxSalary: {
      type: Number,
      min: 0,
    },
    requirements: [String],
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

export default mongoose.model<IPosition>('Position', positionSchema);






