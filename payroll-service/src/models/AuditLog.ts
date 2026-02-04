import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  module: string;
  action: string;
  actor: {
    id: string;
    role?: string;
    email?: string;
  };
  target?: {
    type: string;
    id: string;
  };
  metadata?: Record<string, any>;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    module: { type: String, required: true },
    action: { type: String, required: true },
    actor: {
      id: { type: String, required: true },
      role: { type: String },
      email: { type: String },
    },
    target: {
      type: { type: String },
      id: { type: String },
    },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

auditLogSchema.index({ module: 1, createdAt: -1 });
auditLogSchema.index({ 'actor.id': 1, createdAt: -1 });

export default mongoose.model<IAuditLog>('AuditLog', auditLogSchema);


