import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import connectDB from '../src/config/database';
import Leave from '../src/models/Leave';
import Holiday from '../src/models/Holiday';

dotenv.config();

const seedDemoLeave = async (): Promise<void> => {
  await connectDB();

  const demoPath = path.resolve(__dirname, '../../demo-employee-ids.json');
  if (!fs.existsSync(demoPath)) {
    throw new Error('demo-employee-ids.json not found. Run employee-service seed first.');
  }

  const demo = JSON.parse(fs.readFileSync(demoPath, 'utf-8'));
  const adminEmployeeId = demo.adminEmployeeId;
  const employeeId = demo.employeeId;

  await Leave.deleteMany({});
  await Holiday.deleteMany({});

  const leaveTypes = ['annual', 'sick', 'unpaid', 'maternity', 'personal'];
  const leaveStatuses = ['approved', 'pending', 'rejected'];

  const leaves = Array.from({ length: 10 }, (_, index) => {
    const start = new Date(2026, index % 12, 5 + index);
    const days = (index % 3) + 1;
    const end = new Date(start);
    end.setDate(start.getDate() + days - 1);

    return {
      employee: index % 2 === 0 ? employeeId : adminEmployeeId,
      leaveType: leaveTypes[index % leaveTypes.length],
      startDate: start,
      endDate: end,
      days,
      reason: `Demo leave reason ${index + 1}`,
      status: leaveStatuses[index % leaveStatuses.length],
      approvedBy: index % 3 === 0 ? adminEmployeeId : undefined,
      comments: index % 3 === 0 ? 'Approved' : undefined,
    };
  });

  const holidays = Array.from({ length: 10 }, (_, index) => ({
    name: `Holiday ${index + 1}`,
    date: new Date(2026, index % 12, 1 + index),
    type: index % 2 === 0 ? 'national' : 'company',
    isRecurring: index % 3 === 0,
    description: `Demo holiday ${index + 1}`,
  }));

  await Leave.insertMany(leaves);
  await Holiday.insertMany(holidays);

  console.log('Seed leave demo data completed.');
  process.exit(0);
};

seedDemoLeave().catch((error) => {
  console.error('Seed leave demo data failed:', error);
  process.exit(1);
});



