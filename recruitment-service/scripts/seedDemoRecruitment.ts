import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import connectDB from '../src/config/database';
import { Recruitment, Candidate } from '../src/models/Recruitment';

dotenv.config();

const seedDemoRecruitment = async (): Promise<void> => {
  await connectDB();

  const demoPath = path.resolve(__dirname, '../../demo-employee-ids.json');
  if (!fs.existsSync(demoPath)) {
    throw new Error('demo-employee-ids.json not found. Run employee-service seed first.');
  }

  const demo = JSON.parse(fs.readFileSync(demoPath, 'utf-8'));
  const departmentId = demo.departments?.engineering;
  const positionId = demo.positions?.softwareEngineer;

  await Candidate.deleteMany({});
  await Recruitment.deleteMany({});

  const titles = [
    'Backend Engineer',
    'Frontend Engineer',
    'QA Engineer',
    'DevOps Engineer',
    'HR Specialist',
    'Sales Executive',
    'Marketing Specialist',
    'Finance Analyst',
    'Support Agent',
    'Legal Advisor',
  ];

  const recruitments = await Recruitment.insertMany(
    titles.map((title, index) => ({
      title,
      department: departmentId,
      position: positionId,
      description: `Hiring ${title} for HRM system`,
      requirements: ['Communication', 'Teamwork', 'Problem solving'],
      quantity: (index % 3) + 1,
      status: index % 3 === 0 ? 'open' : index % 3 === 1 ? 'closed' : 'filled',
      postedDate: new Date(2026, 0, 10 + index),
      deadline: new Date(2026, 3, 1 + index),
      createdBy: new mongoose.Types.ObjectId(),
    }))
  );

  const candidates = recruitments.map((recruitment, index) => ({
    recruitment: recruitment._id,
    firstName: `Candidate${index + 1}`,
    lastName: 'Demo',
    email: `candidate.${index + 1}@example.com`,
    phone: `09000001${(index + 1).toString().padStart(2, '0')}`,
    status: index % 3 === 0 ? 'applied' : index % 3 === 1 ? 'interview' : 'offer',
    interviewDate: index % 3 === 1 ? new Date(2026, 2, 10 + index) : undefined,
    rating: index % 3 === 1 ? 4 : undefined,
  }));

  await Candidate.insertMany(candidates);

  console.log('Seed recruitment demo data completed.');
  process.exit(0);
};

seedDemoRecruitment().catch((error) => {
  console.error('Seed recruitment demo data failed:', error);
  process.exit(1);
});



