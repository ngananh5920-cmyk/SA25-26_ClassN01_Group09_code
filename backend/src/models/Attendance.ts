import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendance extends Document {
  employee: mongoose.Types.ObjectId;
  date: Date;
  shift?: mongoose.Types.ObjectId; // Ca làm việc
  checkIn: Date;
  checkOut?: Date;
  status: 'present' | 'absent' | 'late' | 'half-day' | 'overtime';
  workHours?: number;
  overtimeHours?: number; // Giờ tăng ca
  location?: {
    latitude: number;
    longitude: number;
  };
  notes?: string;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    shift: {
      type: Schema.Types.ObjectId,
      ref: 'WorkShift',
    },
    checkIn: {
      type: Date,
      required: true,
    },
    checkOut: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'half-day', 'overtime'],
      default: 'present',
    },
    workHours: {
      type: Number,
      min: 0,
    },
    overtimeHours: {
      type: Number,
      min: 0,
      default: 0,
    },
    location: {
      latitude: Number,
      longitude: Number,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ employee: 1 });
attendanceSchema.index({ date: 1 });

attendanceSchema.pre('save', function (next) {
  if (this.checkIn && this.checkOut) {
    const diffTime = this.checkOut.getTime() - this.checkIn.getTime();
    this.workHours = Math.round((diffTime / (1000 * 60 * 60)) * 100) / 100;
  }
  next();
});

export default mongoose.model<IAttendance>('Attendance', attendanceSchema);


