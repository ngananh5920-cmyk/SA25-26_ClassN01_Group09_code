import mongoose, { Document, Schema } from 'mongoose';

export interface IDepartment extends Document {
  name: string;
  description?: string;
  manager?: mongoose.Types.ObjectId;
  budget?: number;
  status: 'active' | 'inactive';
}

const departmentSchema = new Schema<IDepartment>(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
    },
    manager: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
    },
    budget: {
      type: Number,
      min: 0,
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

export default mongoose.model<IDepartment>('Department', departmentSchema);





