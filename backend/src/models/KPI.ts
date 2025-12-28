import mongoose, { Document, Schema } from 'mongoose';

export interface IKPI extends Document {
  employee: mongoose.Types.ObjectId;
  period: {
    type: 'monthly' | 'quarterly' | 'yearly';
    month?: number;
    quarter?: number;
    year: number;
  };
  goals: Array<{
    name: string;
    target: number;
    actual?: number;
    weight: number; // Phần trăm trọng số
    unit?: string;
  }>;
  overallScore?: number; // Điểm tổng thể
  rating?: 'excellent' | 'good' | 'average' | 'below_average' | 'poor';
  managerComment?: string;
  employeeComment?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  status: 'draft' | 'submitted' | 'reviewed' | 'approved';
}

const kpiSchema = new Schema<IKPI>(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    period: {
      type: {
        type: String,
        enum: ['monthly', 'quarterly', 'yearly'],
        required: true,
      },
      month: {
        type: Number,
        min: 1,
        max: 12,
      },
      quarter: {
        type: Number,
        min: 1,
        max: 4,
      },
      year: {
        type: Number,
        required: true,
      },
    },
    goals: [{
      name: { type: String, required: true },
      target: { type: Number, required: true },
      actual: Number,
      weight: { type: Number, required: true, min: 0, max: 100 },
      unit: String,
    }],
    overallScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    rating: {
      type: String,
      enum: ['excellent', 'good', 'average', 'below_average', 'poor'],
    },
    managerComment: {
      type: String,
    },
    employeeComment: {
      type: String,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'reviewed', 'approved'],
      default: 'draft',
    },
  },
  {
    timestamps: true,
  }
);

kpiSchema.index({ employee: 1, 'period.year': -1, 'period.type': 1 });
kpiSchema.index({ status: 1 });

export default mongoose.model<IKPI>('KPI', kpiSchema);

