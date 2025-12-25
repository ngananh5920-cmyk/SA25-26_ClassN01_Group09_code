import mongoose, { Document, Schema } from 'mongoose';

export interface ISalary extends Document {
  employee: mongoose.Types.ObjectId;
  baseSalary: number;
  allowances: {
    housing?: number;
    transportation?: number;
    meal?: number;
    other?: number;
  };
  deductions: {
    tax?: number;
    insurance?: number;
    other?: number;
  };
  month: number;
  year: number;
  netSalary: number;
  paymentDate?: Date;
  status: 'pending' | 'paid' | 'cancelled';
  notes?: string;
}

const salarySchema = new Schema<ISalary>(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    baseSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    allowances: {
      housing: { type: Number, min: 0, default: 0 },
      transportation: { type: Number, min: 0, default: 0 },
      meal: { type: Number, min: 0, default: 0 },
      other: { type: Number, min: 0, default: 0 },
    },
    deductions: {
      tax: { type: Number, min: 0, default: 0 },
      insurance: { type: Number, min: 0, default: 0 },
      other: { type: Number, min: 0, default: 0 },
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    netSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'cancelled'],
      default: 'pending',
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

salarySchema.index({ employee: 1, month: 1, year: 1 });
salarySchema.pre('save', function (next) {
  const totalAllowances =
    (this.allowances.housing || 0) +
    (this.allowances.transportation || 0) +
    (this.allowances.meal || 0) +
    (this.allowances.other || 0);
  const totalDeductions =
    (this.deductions.tax || 0) +
    (this.deductions.insurance || 0) +
    (this.deductions.other || 0);
  this.netSalary = this.baseSalary + totalAllowances - totalDeductions;
  next();
});

export default mongoose.model<ISalary>('Salary', salarySchema);


