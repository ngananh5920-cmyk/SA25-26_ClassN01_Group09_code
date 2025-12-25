import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendance extends Document {
  employee: mongoose.Types.ObjectId;
  date: Date;
  checkIn: Date;
  checkOut?: Date;
  status: 'present' | 'absent' | 'late' | 'half-day';
  notes?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  workHours?: number; // Số giờ làm việc (tính bằng giờ)
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
      default: Date.now,
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
      enum: ['present', 'absent', 'late', 'half-day'],
      default: 'present',
    },
    notes: {
      type: String,
    },
    location: {
      latitude: Number,
      longitude: Number,
      address: String,
    },
    workHours: {
      type: Number,
      min: 0,
      max: 24,
    },
  },
  {
    timestamps: true,
  }
);

// Index để đảm bảo mỗi nhân viên chỉ có 1 bản ghi chấm công mỗi ngày
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ employee: 1 });

// Tính toán workHours trước khi save
attendanceSchema.pre('save', function (next) {
  if (this.checkIn && this.checkOut) {
    const diffTime = this.checkOut.getTime() - this.checkIn.getTime();
    this.workHours = Math.round((diffTime / (1000 * 60 * 60)) * 100) / 100; // Làm tròn 2 chữ số
  }
  next();
});

export default mongoose.model<IAttendance>('Attendance', attendanceSchema);

