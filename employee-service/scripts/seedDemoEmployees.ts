import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import connectDB from '../src/config/database';
import Department from '../src/models/Department';
import Position from '../src/models/Position';
import Employee from '../src/models/Employee';

dotenv.config();

const seedDemoEmployees = async (): Promise<void> => {
  await connectDB();

  await Employee.deleteMany({});
  await Position.deleteMany({});
  await Department.deleteMany({});

  const departmentsData = [
    { name: 'HR', description: 'Human Resources', status: 'active' },
    { name: 'Engineering', description: 'Engineering Department', status: 'active' },
    { name: 'Finance', description: 'Finance and Accounting', status: 'active' },
    { name: 'Sales', description: 'Sales Department', status: 'active' },
    { name: 'Marketing', description: 'Marketing Department', status: 'active' },
    { name: 'Operations', description: 'Operations Department', status: 'active' },
    { name: 'Support', description: 'Customer Support', status: 'active' },
    { name: 'IT', description: 'IT Services', status: 'active' },
    { name: 'Legal', description: 'Legal Department', status: 'active' },
    { name: 'R&D', description: 'Research and Development', status: 'active' },
  ];

  const departments = await Department.insertMany(departmentsData);
  const hrDept = departments.find((dept) => dept.name === 'HR')!;
  const engDept = departments.find((dept) => dept.name === 'Engineering')!;

  const positionsData = [
    {
      title: 'HR Manager',
      description: 'HR Manager',
      department: hrDept._id,
      minSalary: 1500_0000,
      maxSalary: 3000_0000,
      requirements: ['HR policies', 'Communication'],
      status: 'active',
    },
    {
      title: 'HR Specialist',
      description: 'HR Specialist',
      department: hrDept._id,
      minSalary: 1000_0000,
      maxSalary: 2000_0000,
      requirements: ['Recruiting', 'Onboarding'],
      status: 'active',
    },
    {
      title: 'Software Engineer',
      description: 'Backend/Frontend Engineer',
      department: engDept._id,
      minSalary: 1200_0000,
      maxSalary: 2800_0000,
      requirements: ['Node.js', 'TypeScript'],
      status: 'active',
    },
    {
      title: 'QA Engineer',
      description: 'Quality Assurance Engineer',
      department: engDept._id,
      minSalary: 1000_0000,
      maxSalary: 2200_0000,
      requirements: ['Testing', 'Automation'],
      status: 'active',
    },
    {
      title: 'DevOps Engineer',
      description: 'DevOps Engineer',
      department: engDept._id,
      minSalary: 1300_0000,
      maxSalary: 2600_0000,
      requirements: ['CI/CD', 'Docker'],
      status: 'active',
    },
    {
      title: 'Sales Executive',
      description: 'Sales Executive',
      department: departments.find((dept) => dept.name === 'Sales')!._id,
      minSalary: 900_0000,
      maxSalary: 2000_0000,
      requirements: ['Sales', 'CRM'],
      status: 'active',
    },
    {
      title: 'Marketing Specialist',
      description: 'Marketing Specialist',
      department: departments.find((dept) => dept.name === 'Marketing')!._id,
      minSalary: 900_0000,
      maxSalary: 1900_0000,
      requirements: ['SEO', 'Content'],
      status: 'active',
    },
    {
      title: 'Finance Analyst',
      description: 'Finance Analyst',
      department: departments.find((dept) => dept.name === 'Finance')!._id,
      minSalary: 1100_0000,
      maxSalary: 2100_0000,
      requirements: ['Accounting', 'Reporting'],
      status: 'active',
    },
    {
      title: 'Support Agent',
      description: 'Support Agent',
      department: departments.find((dept) => dept.name === 'Support')!._id,
      minSalary: 800_0000,
      maxSalary: 1600_0000,
      requirements: ['Customer service'],
      status: 'active',
    },
    {
      title: 'Legal Advisor',
      description: 'Legal Advisor',
      department: departments.find((dept) => dept.name === 'Legal')!._id,
      minSalary: 1400_0000,
      maxSalary: 2600_0000,
      requirements: ['Compliance', 'Contracts'],
      status: 'active',
    },
  ];

  const positions = await Position.insertMany(positionsData);
  const hrManager = positions.find((pos) => pos.title === 'HR Manager')!;
  const softwareEngineer = positions.find((pos) => pos.title === 'Software Engineer')!;

  const adminEmployee = await Employee.create({
    employeeId: 'EMP001',
    firstName: 'Admin',
    lastName: 'HRM',
    email: 'admin@hrm.com',
    phone: '0900000001',
    dateOfBirth: new Date('1990-01-01'),
    gender: 'male',
    address: 'Hanoi',
    department: hrDept._id,
    position: hrManager._id,
    salary: 2500_0000,
    hireDate: new Date('2020-01-01'),
    status: 'active',
  });

  const employee = await Employee.create({
    employeeId: 'EMP002',
    firstName: 'Employee',
    lastName: 'Demo',
    email: 'employee@hrm.com',
    phone: '0900000002',
    dateOfBirth: new Date('1995-05-05'),
    gender: 'female',
    address: 'HCMC',
    department: engDept._id,
    position: softwareEngineer._id,
    manager: adminEmployee._id,
    salary: 1800_0000,
    hireDate: new Date('2021-06-01'),
    status: 'active',
  });

  const extraEmployees = [
    {
      employeeId: 'EMP003',
      firstName: 'Nguyen',
      lastName: 'An',
      email: 'nguyen.an@hrm.com',
      phone: '0900000003',
      dateOfBirth: new Date('1992-03-12'),
      gender: 'male',
      address: 'Da Nang',
      department: departments.find((dept) => dept.name === 'Finance')!._id,
      position: positions.find((pos) => pos.title === 'Finance Analyst')!._id,
      manager: adminEmployee._id,
      salary: 1600_0000,
      hireDate: new Date('2021-03-15'),
      status: 'active',
    },
    {
      employeeId: 'EMP004',
      firstName: 'Tran',
      lastName: 'Binh',
      email: 'tran.binh@hrm.com',
      phone: '0900000004',
      dateOfBirth: new Date('1993-07-20'),
      gender: 'male',
      address: 'Hanoi',
      department: departments.find((dept) => dept.name === 'Sales')!._id,
      position: positions.find((pos) => pos.title === 'Sales Executive')!._id,
      manager: adminEmployee._id,
      salary: 1500_0000,
      hireDate: new Date('2022-01-10'),
      status: 'active',
    },
    {
      employeeId: 'EMP005',
      firstName: 'Le',
      lastName: 'Chi',
      email: 'le.chi@hrm.com',
      phone: '0900000005',
      dateOfBirth: new Date('1994-11-05'),
      gender: 'female',
      address: 'HCMC',
      department: departments.find((dept) => dept.name === 'Marketing')!._id,
      position: positions.find((pos) => pos.title === 'Marketing Specialist')!._id,
      manager: adminEmployee._id,
      salary: 1400_0000,
      hireDate: new Date('2022-06-01'),
      status: 'active',
    },
    {
      employeeId: 'EMP006',
      firstName: 'Pham',
      lastName: 'Dung',
      email: 'pham.dung@hrm.com',
      phone: '0900000006',
      dateOfBirth: new Date('1991-02-28'),
      gender: 'female',
      address: 'Hai Phong',
      department: departments.find((dept) => dept.name === 'Support')!._id,
      position: positions.find((pos) => pos.title === 'Support Agent')!._id,
      manager: adminEmployee._id,
      salary: 1200_0000,
      hireDate: new Date('2021-09-12'),
      status: 'active',
    },
    {
      employeeId: 'EMP007',
      firstName: 'Vo',
      lastName: 'Huy',
      email: 'vo.huy@hrm.com',
      phone: '0900000007',
      dateOfBirth: new Date('1990-12-14'),
      gender: 'male',
      address: 'Can Tho',
      department: departments.find((dept) => dept.name === 'Engineering')!._id,
      position: positions.find((pos) => pos.title === 'QA Engineer')!._id,
      manager: adminEmployee._id,
      salary: 1700_0000,
      hireDate: new Date('2020-08-20'),
      status: 'active',
    },
    {
      employeeId: 'EMP008',
      firstName: 'Ngo',
      lastName: 'Khanh',
      email: 'ngo.khanh@hrm.com',
      phone: '0900000008',
      dateOfBirth: new Date('1996-04-08'),
      gender: 'female',
      address: 'Hanoi',
      department: departments.find((dept) => dept.name === 'Engineering')!._id,
      position: positions.find((pos) => pos.title === 'DevOps Engineer')!._id,
      manager: adminEmployee._id,
      salary: 2000_0000,
      hireDate: new Date('2023-02-01'),
      status: 'active',
    },
    {
      employeeId: 'EMP009',
      firstName: 'Do',
      lastName: 'Lam',
      email: 'do.lam@hrm.com',
      phone: '0900000009',
      dateOfBirth: new Date('1992-09-18'),
      gender: 'male',
      address: 'HCMC',
      department: departments.find((dept) => dept.name === 'IT')!._id,
      position: positions.find((pos) => pos.title === 'Software Engineer')!._id,
      manager: adminEmployee._id,
      salary: 1900_0000,
      hireDate: new Date('2021-11-03'),
      status: 'active',
    },
    {
      employeeId: 'EMP010',
      firstName: 'Hoang',
      lastName: 'Minh',
      email: 'hoang.minh@hrm.com',
      phone: '0900000010',
      dateOfBirth: new Date('1993-05-22'),
      gender: 'male',
      address: 'Da Nang',
      department: departments.find((dept) => dept.name === 'Legal')!._id,
      position: positions.find((pos) => pos.title === 'Legal Advisor')!._id,
      manager: adminEmployee._id,
      salary: 2100_0000,
      hireDate: new Date('2020-04-15'),
      status: 'active',
    },
  ];

  await Employee.insertMany(extraEmployees);

  const managerByDepartment: Record<string, string> = {
    HR: adminEmployee._id.toString(),
    Engineering: employee._id.toString(),
    Finance: adminEmployee._id.toString(),
    Sales: adminEmployee._id.toString(),
    Marketing: adminEmployee._id.toString(),
    Operations: adminEmployee._id.toString(),
    Support: adminEmployee._id.toString(),
    IT: adminEmployee._id.toString(),
    Legal: adminEmployee._id.toString(),
    'R&D': adminEmployee._id.toString(),
  };

  await Promise.all(
    departments.map((dept) =>
      Department.findByIdAndUpdate(dept._id, { manager: managerByDepartment[dept.name] })
    )
  );

  const output = {
    adminEmployeeId: adminEmployee._id.toString(),
    employeeId: employee._id.toString(),
    departments: {
      hr: hrDept._id.toString(),
      engineering: engDept._id.toString(),
    },
    positions: {
      hrManager: hrManager._id.toString(),
      softwareEngineer: softwareEngineer._id.toString(),
    },
  };

  const outputPath = path.resolve(__dirname, '../../demo-employee-ids.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

  console.log('Seed employee demo data completed.');
  process.exit(0);
};

seedDemoEmployees().catch((error) => {
  console.error('Seed employee demo data failed:', error);
  process.exit(1);
});



