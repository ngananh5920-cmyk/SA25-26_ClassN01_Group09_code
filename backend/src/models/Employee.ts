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
  department: mongoose.Types.ObjectId;
  position: mongoose.Types.ObjectId;
  salary: number;
  hireDate: Date;
  status: 'active' | 'inactive' | 'terminated';
  avatar?: string;
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
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


