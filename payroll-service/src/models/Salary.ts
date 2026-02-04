import mongoose, { Document, Schema } from 'mongoose';

export interface ISalary extends Document {
  employee: mongoose.Types.ObjectId;
  baseSalary: number;
  overtimeHours?: number; // Overtime hours
  overtimePay?: number; // Overtime pay
  allowances: {
    housing?: number;
    transportation?: number;
    meal?: number;
    other?: number;
  };
  bonuses?: {
    performance?: number; // Performance bonus
    project?: number; // Project bonus
    other?: number;
  };
  penalties?: {
    late?: number; // Late penalty
    absent?: number; // Unexcused absence penalty
    other?: number;
  };
  deductions: {
    tax?: number; // Personal income tax
    socialInsurance?: number; // Social insurance (8%)
    healthInsurance?: number; // Health insurance (1.5%)
    unemploymentInsurance?: number; // Unemployment insurance (1%)
    other?: number;
  };
  month: number;
  year: number;
  grossSalary?: number; // Gross income before tax
  netSalary: number; // Net salary
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
    overtimeHours: {
      type: Number,
      min: 0,
      default: 0,
    },
    overtimePay: {
      type: Number,
      min: 0,
      default: 0,
    },
    allowances: {
      housing: { type: Number, min: 0, default: 0 },
      transportation: { type: Number, min: 0, default: 0 },
      meal: { type: Number, min: 0, default: 0 },
      other: { type: Number, min: 0, default: 0 },
    },
    bonuses: {
      performance: { type: Number, min: 0, default: 0 },
      project: { type: Number, min: 0, default: 0 },
      other: { type: Number, min: 0, default: 0 },
    },
    penalties: {
      late: { type: Number, min: 0, default: 0 },
      absent: { type: Number, min: 0, default: 0 },
      other: { type: Number, min: 0, default: 0 },
    },
    deductions: {
      tax: { type: Number, min: 0, default: 0 }, // Personal income tax
      socialInsurance: { type: Number, min: 0, default: 0 }, // Social insurance
      healthInsurance: { type: Number, min: 0, default: 0 }, // Health insurance
      unemploymentInsurance: { type: Number, min: 0, default: 0 }, // Unemployment insurance
      other: { type: Number, min: 0, default: 0 },
    },
    grossSalary: {
      type: Number,
      min: 0,
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
  
  const totalBonuses =
    (this.bonuses?.performance || 0) +
    (this.bonuses?.project || 0) +
    (this.bonuses?.other || 0);
  
  const totalPenalties =
    (this.penalties?.late || 0) +
    (this.penalties?.absent || 0) +
    (this.penalties?.other || 0);
  
  const totalDeductions =
    (this.deductions.tax || 0) +
    (this.deductions.socialInsurance || 0) +
    (this.deductions.healthInsurance || 0) +
    (this.deductions.unemploymentInsurance || 0) +
    (this.deductions.other || 0);
  
  // Gross salary = base + allowances + overtime + bonuses - penalties
  this.grossSalary = this.baseSalary + totalAllowances + (this.overtimePay || 0) + totalBonuses - totalPenalties;
  
  // Net salary = gross - deductions
  this.netSalary = (this.grossSalary || 0) - totalDeductions;
  
  next();
});

export default mongoose.model<ISalary>('Salary', salarySchema);





