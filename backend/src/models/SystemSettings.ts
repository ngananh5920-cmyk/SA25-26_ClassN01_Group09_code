import mongoose, { Document, Schema } from 'mongoose';

export interface ISystemSettings extends Document {
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  category: 'payroll' | 'attendance' | 'leave' | 'holiday' | 'general';
  description?: string;
}

const systemSettingsSchema = new Schema<ISystemSettings>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
    type: {
      type: String,
      enum: ['string', 'number', 'boolean', 'object', 'array'],
      required: true,
    },
    category: {
      type: String,
      enum: ['payroll', 'attendance', 'leave', 'holiday', 'general'],
      required: true,
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

systemSettingsSchema.index({ key: 1 });
systemSettingsSchema.index({ category: 1 });

export default mongoose.model<ISystemSettings>('SystemSettings', systemSettingsSchema);

