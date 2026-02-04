import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import connectDB from '../src/config/database';
import Salary from '../src/models/Salary';

dotenv.config();

const seedDemoPayroll = async (): Promise<void> => {
  await connectDB();

  const demoPath = path.resolve(__dirname, '../../demo-employee-ids.json');
  if (!fs.existsSync(demoPath)) {
    throw new Error('demo-employee-ids.json not found. Run employee-service seed first.');
  }

  const demo = JSON.parse(fs.readFileSync(demoPath, 'utf-8'));
  const employeeId = demo.employeeId;

  await Salary.deleteMany({});

  const salaries = Array.from({ length: 10 }, (_, index) => {
    const month = index + 1;
    const baseSalary = (1700 + index * 50) * 10_000;
    const allowances = { housing: 1_000_000, transportation: 500_000, meal: 300_000, other: 0 };
    const deductions = { tax: 500_000, socialInsurance: 800_000, healthInsurance: 200_000, unemploymentInsurance: 100_000, other: 0 };

    return {
      employee: employeeId,
      baseSalary,
      allowances,
      deductions,
      month,
      year: 2026,
      netSalary: 0,
      status: index % 2 === 0 ? 'paid' : 'pending',
      paymentDate: new Date(2026, month - 1, 28),
      notes: `Demo payroll for month ${month}`,
    };
  });

  await Salary.insertMany(salaries);

  console.log('Seed payroll demo data completed.');
  process.exit(0);
};

seedDemoPayroll().catch((error) => {
  console.error('Seed payroll demo data failed:', error);
  process.exit(1);
});



