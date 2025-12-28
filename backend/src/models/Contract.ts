import mongoose, { Document, Schema } from 'mongoose';

export interface IContract extends Document {
  employee: mongoose.Types.ObjectId;
  contractType: 'full-time' | 'part-time' | 'contract' | 'intern';
  startDate: Date;
  endDate?: Date;
  salary: number;
  position: mongoose.Types.ObjectId;
  department: mongoose.Types.ObjectId;
  contractFile?: string; // URL to PDF file
  status: 'active' | 'expired' | 'terminated';
  notes?: string;
}

const contractSchema = new Schema<IContract>(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    contractType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'intern'],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
    },
    salary: {
      type: Number,
      required: true,
      min: 0,
    },
    position: {
      type: Schema.Types.ObjectId,
      ref: 'Position',
      required: true,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    contractFile: {
      type: String,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'terminated'],
      default: 'active',
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

contractSchema.index({ employee: 1, startDate: -1 });
contractSchema.index({ endDate: 1, status: 1 }); // For finding expiring contracts

export default mongoose.model<IContract>('Contract', contractSchema);

