import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  user: mongoose.Types.ObjectId;
  type: 'leave_pending' | 'leave_approved' | 'leave_rejected' | 'salary_paid' | 'attendance_reminder';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  data?: any;
}

const notificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['leave_pending', 'leave_approved', 'leave_rejected', 'salary_paid', 'attendance_reminder'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    link: {
      type: String,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    data: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

export default mongoose.model<INotification>('Notification', notificationSchema);

