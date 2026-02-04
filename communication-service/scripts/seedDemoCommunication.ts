import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import connectDB from '../src/config/database';
import Announcement from '../src/models/Announcement';
import SystemSettings from '../src/models/SystemSettings';

dotenv.config();

const seedDemoCommunication = async (): Promise<void> => {
  await connectDB();

  const demoPath = path.resolve(__dirname, '../../demo-employee-ids.json');
  if (!fs.existsSync(demoPath)) {
    throw new Error('demo-employee-ids.json not found. Run employee-service seed first.');
  }

  const demo = JSON.parse(fs.readFileSync(demoPath, 'utf-8'));
  const departmentId = demo.departments?.engineering;

  await Announcement.deleteMany({});
  await SystemSettings.deleteMany({});

  const announcements = Array.from({ length: 20 }, (_, index) => ({
    title: `Thông báo ${index + 1}`,
    content: `Nội dung thông báo demo số ${index + 1}.`,
    type: index % 4 === 0 ? 'company' : index % 4 === 1 ? 'news' : index % 4 === 2 ? 'event' : 'policy',
    priority: index % 4 === 0 ? 'low' : index % 4 === 1 ? 'normal' : index % 4 === 2 ? 'high' : 'urgent',
    targetAudience: 'all',
    status: 'published',
    publishDate: new Date(Date.now() - index * 24 * 60 * 60 * 1000),
    createdBy: new mongoose.Types.ObjectId(),
  }));

  await Announcement.insertMany(announcements);

  const settings = [
    { key: 'leave.max_days', value: 12, type: 'number', category: 'leave', description: 'Maximum leave days per year' },
    { key: 'payroll.currency', value: 'VND', type: 'string', category: 'payroll', description: 'Default payroll currency' },
    { key: 'attendance.checkin_time', value: '08:30', type: 'string', category: 'attendance', description: 'Standard check-in time' },
    { key: 'attendance.checkout_time', value: '17:30', type: 'string', category: 'attendance', description: 'Standard check-out time' },
    { key: 'holiday.weekend_policy', value: 'Saturday-Sunday', type: 'string', category: 'holiday', description: 'Weekend policy' },
    { key: 'general.company_name', value: 'HRM Demo Corp', type: 'string', category: 'general', description: 'Company name' },
    { key: 'general.timezone', value: 'Asia/Ho_Chi_Minh', type: 'string', category: 'general', description: 'Default timezone' },
    { key: 'leave.carry_over', value: true, type: 'boolean', category: 'leave', description: 'Allow leave carry over' },
    { key: 'payroll.overtime_rate', value: 1.5, type: 'number', category: 'payroll', description: 'Overtime pay rate' },
    { key: 'holiday.max_per_year', value: 10, type: 'number', category: 'holiday', description: 'Max holidays per year' },
  ];

  await SystemSettings.insertMany(settings);

  console.log('Seed communication demo data completed.');
  process.exit(0);
};

seedDemoCommunication().catch((error) => {
  console.error('Seed communication demo data failed:', error);
  process.exit(1);
});



