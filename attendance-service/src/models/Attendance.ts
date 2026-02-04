import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendance extends Document {
  employee: mongoose.Types.ObjectId;
  date: Date;
  shiftName: string;
  startTime: string;
  endTime: string;
  checkIn?: string;
  checkOut?: string;
  status: 'on_time' | 'late' | 'early' | 'absent' | 'leave';
  note?: string;
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
    shiftName: {
      type: String,
      required: true,
      trim: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    checkIn: String,
    checkOut: String,
    status: {
      type: String,
      enum: ['on_time', 'late', 'early', 'absent', 'leave'],
      default: 'on_time',
    },
    note: String,
  },
  {
    timestamps: true,
  }
);

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });

export default mongoose.model<IAttendance>('Attendance', attendanceSchema);



