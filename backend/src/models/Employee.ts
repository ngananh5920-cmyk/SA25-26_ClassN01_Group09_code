import mongoose, { Document, Schema } from 'mongoose';

export interface IEmployee extends Document {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  address: string;
  cccd?: string; // Căn cước công dân
  department: mongoose.Types.ObjectId;
  position: mongoose.Types.ObjectId;
  manager?: mongoose.Types.ObjectId; // Quản lý trực tiếp
  salary: number;
  hireDate: Date;
  contractEndDate?: Date; // Ngày hết hạn hợp đồng
  status: 'active' | 'inactive' | 'terminated';
  avatar?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  skills?: Array<{
    name: string;
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    certificate?: string;
  }>;
  workHistory?: Array<{
    date: Date;
    type: 'promotion' | 'transfer' | 'salary_change' | 'position_change';
    description: string;
    from?: string;
    to?: string;
  }>;
}

const employeeSchema = new Schema<IEmployee>(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    cccd: {
      type: String,
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
    manager: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
    },
    salary: {
      type: Number,
      required: [true, 'Salary is required'],
      min: 0,
    },
    hireDate: {
      type: Date,
      required: [true, 'Hire date is required'],
      default: Date.now,
    },
    contractEndDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'terminated'],
      default: 'active',
    },
    avatar: {
      type: String,
    },
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String,
    },
    skills: [{
      name: { type: String, required: true },
      level: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'], default: 'beginner' },
      certificate: String,
    }],
    workHistory: [{
      date: { type: Date, required: true },
      type: { type: String, enum: ['promotion', 'transfer', 'salary_change', 'position_change'], required: true },
      description: { type: String, required: true },
      from: String,
      to: String,
    }],
  },
  {
    timestamps: true,
  }
);

employeeSchema.index({ email: 1 });
employeeSchema.index({ employeeId: 1 });
employeeSchema.index({ department: 1 });
employeeSchema.index({ position: 1 });

export default mongoose.model<IEmployee>('Employee', employeeSchema);





