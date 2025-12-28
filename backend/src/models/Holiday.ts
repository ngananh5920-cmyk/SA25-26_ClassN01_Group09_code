import mongoose, { Document, Schema } from 'mongoose';

export interface IHoliday extends Document {
  name: string;
  date: Date;
  type: 'national' | 'company' | 'regional';
  isRecurring: boolean; // Lặp lại hàng năm
  description?: string;
}

const holidaySchema = new Schema<IHoliday>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    type: {
      type: String,
      enum: ['national', 'company', 'regional'],
      required: true,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

holidaySchema.index({ date: 1 });
holidaySchema.index({ type: 1 });

export default mongoose.model<IHoliday>('Holiday', holidaySchema);


