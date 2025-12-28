import mongoose, { Document, Schema } from 'mongoose';

export interface IAnnouncement extends Document {
  title: string;
  content: string;
  type: 'company' | 'news' | 'event' | 'policy';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  targetAudience: 'all' | mongoose.Types.ObjectId[]; // 'all' or specific departments
  publishDate: Date;
  expiryDate?: Date;
  attachments?: string[]; // URLs to files
  createdBy: mongoose.Types.ObjectId;
  status: 'draft' | 'published' | 'archived';
}

const announcementSchema = new Schema<IAnnouncement>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['company', 'news', 'event', 'policy'],
      required: true,
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
    },
    targetAudience: {
      type: Schema.Types.Mixed, // Can be 'all' or array of department IDs
      default: 'all',
    },
    publishDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
    },
    attachments: [String],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
  },
  {
    timestamps: true,
  }
);

announcementSchema.index({ status: 1, publishDate: -1 });
announcementSchema.index({ type: 1 });
announcementSchema.index({ expiryDate: 1 });

export default mongoose.model<IAnnouncement>('Announcement', announcementSchema);


