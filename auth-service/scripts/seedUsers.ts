import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import connectDB from '../src/config/database';
import User from '../src/models/User';

dotenv.config();

const seedUsers = async (): Promise<void> => {
  await connectDB();

  let employeeId: string | undefined;
  try {
    const demoPath = path.resolve(__dirname, '../../demo-employee-ids.json');
    if (fs.existsSync(demoPath)) {
      const data = JSON.parse(fs.readFileSync(demoPath, 'utf-8'));
      employeeId = data.employeeId;
    }
  } catch (error) {
    console.warn('Could not read demo employee ids:', error);
  }

  const users = [
    { email: 'admin@hrm.com', password: 'admin123', role: 'admin' as const },
    { email: 'employee@hrm.com', password: 'employee123', role: 'employee' as const, employeeId },
    { email: 'hr1@hrm.com', password: 'hr12345', role: 'hr' as const },
    { email: 'hr2@hrm.com', password: 'hr12345', role: 'hr' as const },
    { email: 'manager1@hrm.com', password: 'manager123', role: 'manager' as const },
    { email: 'manager2@hrm.com', password: 'manager123', role: 'manager' as const },
    { email: 'staff1@hrm.com', password: 'staff123', role: 'employee' as const },
    { email: 'staff2@hrm.com', password: 'staff123', role: 'employee' as const },
    { email: 'staff3@hrm.com', password: 'staff123', role: 'employee' as const },
    { email: 'staff4@hrm.com', password: 'staff123', role: 'employee' as const },
  ];

  for (const userData of users) {
    const existing = await User.findOne({ email: userData.email }).select('+password');
    if (existing) {
      existing.password = userData.password;
      existing.role = userData.role;
      if (userData.employeeId) {
        existing.employeeId = userData.employeeId as any;
      }
      await existing.save();
      continue;
    }
    await User.create(userData);
  }

  console.log('Seed users completed.');
  process.exit(0);
};

seedUsers().catch((error) => {
  console.error('Seed users failed:', error);
  process.exit(1);
});


