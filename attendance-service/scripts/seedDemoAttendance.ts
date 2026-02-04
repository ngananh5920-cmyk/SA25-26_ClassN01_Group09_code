import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import connectDB from '../src/config/database';
import Attendance from '../src/models/Attendance';

dotenv.config();

const seedDemoAttendance = async (): Promise<void> => {
  await connectDB();

  const demoPath = path.resolve(__dirname, '../../demo-employee-ids.json');
  if (!fs.existsSync(demoPath)) {
    throw new Error('demo-employee-ids.json not found. Run employee-service seed first.');
  }

  const demo = JSON.parse(fs.readFileSync(demoPath, 'utf-8'));
  const employeeId = demo.employeeId || demo.adminEmployeeId;

  await Attendance.deleteMany({});

  const baseDate = new Date();
  baseDate.setHours(0, 0, 0, 0);

  const statuses = ['on_time', 'late', 'early', 'absent', 'leave'] as const;
  const events = Array.from({ length: 10 }, (_, index) => {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + index);

    const status = statuses[index % statuses.length];
    const hasCheck = status === 'on_time' || status === 'late' || status === 'early';

    return {
      employee: employeeId,
      date,
      shiftName: index % 2 === 0 ? 'Ca hành chính' : 'Ca sáng',
      startTime: index % 2 === 0 ? '08:00' : '08:00',
      endTime: index % 2 === 0 ? '17:00' : '12:00',
      checkIn: hasCheck ? (status === 'late' ? '08:15' : '08:02') : undefined,
      checkOut: hasCheck ? (status === 'early' ? '16:30' : (index % 2 === 0 ? '17:05' : '12:01')) : undefined,
      status,
      note:
        status === 'late'
          ? 'Muộn 15p'
          : status === 'early'
          ? 'Về sớm 30p'
          : status === 'absent'
          ? 'Vắng mặt'
          : status === 'leave'
          ? 'Nghỉ phép'
          : undefined,
    };
  });

  await Attendance.insertMany(events);

  console.log('Seed attendance demo data completed.');
  process.exit(0);
};

seedDemoAttendance().catch((error) => {
  console.error('Seed attendance demo data failed:', error);
  process.exit(1);
});



