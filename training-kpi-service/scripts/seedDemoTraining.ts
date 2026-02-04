import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import connectDB from '../src/config/database';
import { Training, TrainingEnrollment } from '../src/models/Training';
import KPI from '../src/models/KPI';

dotenv.config();

const seedDemoTraining = async (): Promise<void> => {
  await connectDB();

  const demoPath = path.resolve(__dirname, '../../demo-employee-ids.json');
  if (!fs.existsSync(demoPath)) {
    throw new Error('demo-employee-ids.json not found. Run employee-service seed first.');
  }

  const demo = JSON.parse(fs.readFileSync(demoPath, 'utf-8'));
  const employeeId = demo.employeeId;

  await TrainingEnrollment.deleteMany({});
  await Training.deleteMany({});
  await KPI.deleteMany({});

  const trainings = await Training.insertMany(
    Array.from({ length: 20 }, (_, index) => ({
      title: `Training Program ${index + 1}`,
      description: `Demo training program ${index + 1}`,
      type: index % 2 === 0 ? 'internal' : 'online',
      instructor: index % 2 === 0 ? 'Tech Lead' : 'External Instructor',
      startDate: new Date(2026, index % 12, 5 + (index % 20)),
      endDate: new Date(2026, index % 12, 6 + (index % 20)),
      location: index % 2 === 0 ? 'Office' : 'Online',
      maxParticipants: 30 + (index % 20),
      status: index % 3 === 0 ? 'scheduled' : index % 3 === 1 ? 'ongoing' : 'completed',
      createdBy: new mongoose.Types.ObjectId(),
    }))
  );

  const enrollments = trainings.map((training, index) => ({
    training: training._id,
    employee: employeeId,
    status: index % 3 === 0 ? 'enrolled' : index % 3 === 1 ? 'attending' : 'completed',
    progress: index % 3 === 2 ? 100 : Math.min((index + 1) * 7, 100),
  }));

  await TrainingEnrollment.insertMany(enrollments);

  const kpis = Array.from({ length: 20 }, (_, index) => ({
    employee: employeeId,
    period: { type: 'monthly', month: (index % 12) + 1, year: 2026 + Math.floor(index / 12) },
    goals: [
      { name: 'Feature delivery', target: 5 + index, actual: 3 + index, weight: 60, unit: 'items' },
      { name: 'Bug fixes', target: 8 + index, actual: 6 + index, weight: 40, unit: 'items' },
    ],
    overallScore: 65 + index,
    rating: index % 3 === 0 ? 'good' : index % 3 === 1 ? 'average' : 'excellent',
    status: index % 3 === 0 ? 'submitted' : index % 3 === 1 ? 'reviewed' : 'approved',
  }));

  await KPI.insertMany(kpis);

  console.log('Seed training & KPI demo data completed.');
  process.exit(0);
};

seedDemoTraining().catch((error) => {
  console.error('Seed training & KPI demo data failed:', error);
  process.exit(1);
});



