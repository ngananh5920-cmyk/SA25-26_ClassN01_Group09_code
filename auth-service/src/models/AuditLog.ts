import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  module: string;
  action: string;
  entityId?: string;
  actor: {
    id?: string;
    email?: string;
    role?: string;
    employeeId?: string;
  };
  metadata?: any;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    module: { type: String, required: true, index: true },
    action: { type: String, required: true, index: true },
    entityId: { type: String },
    actor: {
      id: String,
      email: String,
      role: String,
      employeeId: String,
    },
    metadata: Schema.Types.Mixed,
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });

export default mongoose.model<IAuditLog>('AuditLog', auditLogSchema);

