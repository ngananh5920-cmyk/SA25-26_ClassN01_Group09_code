import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Department from '../src/models/Department';
import Position from '../src/models/Position';
import Employee from '../src/models/Employee';
import Salary from '../src/models/Salary';

dotenv.config();

// Dữ liệu mẫu
const departmentsData = [
  {
    name: 'Phòng Công nghệ thông tin',
    description: 'Quản lý và phát triển hệ thống công nghệ thông tin',
    budget: 500000000,
    status: 'active' as const,
  },
  {
    name: 'Phòng Nhân sự',
    description: 'Quản lý nhân sự, tuyển dụng và đào tạo',
    budget: 300000000,
    status: 'active' as const,
  },
  {
    name: 'Phòng Kinh doanh',
    description: 'Phát triển kinh doanh và quan hệ khách hàng',
    budget: 800000000,
    status: 'active' as const,
  },
  {
    name: 'Phòng Tài chính - Kế toán',
    description: 'Quản lý tài chính và kế toán công ty',
    budget: 400000000,
    status: 'active' as const,
  },
  {
    name: 'Phòng Marketing',
    description: 'Marketing và truyền thông',
    budget: 350000000,
    status: 'active' as const,
  },
];

const positionsData = [
  // IT Department
  { title: 'Trưởng phòng IT', minSalary: 25000000, maxSalary: 35000000, description: 'Quản lý phòng IT' },
  { title: 'Lập trình viên Senior', minSalary: 20000000, maxSalary: 28000000, description: 'Phát triển phần mềm' },
  { title: 'Lập trình viên', minSalary: 15000000, maxSalary: 22000000, description: 'Phát triển phần mềm' },
  { title: 'DevOps Engineer', minSalary: 18000000, maxSalary: 25000000, description: 'Vận hành hệ thống' },
  
  // HR Department
  { title: 'Trưởng phòng Nhân sự', minSalary: 22000000, maxSalary: 30000000, description: 'Quản lý phòng HR' },
  { title: 'Chuyên viên Nhân sự', minSalary: 12000000, maxSalary: 18000000, description: 'Quản lý nhân sự' },
  { title: 'Chuyên viên Tuyển dụng', minSalary: 13000000, maxSalary: 19000000, description: 'Tuyển dụng nhân sự' },
  
  // Sales Department
  { title: 'Trưởng phòng Kinh doanh', minSalary: 28000000, maxSalary: 40000000, description: 'Quản lý phòng Sales' },
  { title: 'Nhân viên Kinh doanh', minSalary: 10000000, maxSalary: 20000000, description: 'Phát triển kinh doanh' },
  { title: 'Trưởng nhóm Kinh doanh', minSalary: 18000000, maxSalary: 25000000, description: 'Quản lý nhóm kinh doanh' },
  
  // Finance Department
  { title: 'Trưởng phòng Tài chính', minSalary: 25000000, maxSalary: 35000000, description: 'Quản lý tài chính' },
  { title: 'Kế toán trưởng', minSalary: 20000000, maxSalary: 28000000, description: 'Quản lý kế toán' },
  { title: 'Kế toán viên', minSalary: 10000000, maxSalary: 18000000, description: 'Xử lý kế toán' },
  
  // Marketing Department
  { title: 'Trưởng phòng Marketing', minSalary: 24000000, maxSalary: 33000000, description: 'Quản lý marketing' },
  { title: 'Chuyên viên Marketing', minSalary: 12000000, maxSalary: 20000000, description: 'Marketing và truyền thông' },
];

const employeesData = [
  // IT Department
  { firstName: 'Nguyễn', lastName: 'Văn An', email: 'nguyenvanan@company.com', phone: '0912345678', dateOfBirth: new Date('1985-05-15'), gender: 'male' as const, address: '123 Đường ABC, Quận 1, TP.HCM', salary: 30000000, hireDate: new Date('2020-01-15'), status: 'active' as const },
  { firstName: 'Trần', lastName: 'Thị Bình', email: 'tranthibinh@company.com', phone: '0912345679', dateOfBirth: new Date('1990-08-20'), gender: 'female' as const, address: '456 Đường XYZ, Quận 3, TP.HCM', salary: 25000000, hireDate: new Date('2021-03-10'), status: 'active' as const },
  { firstName: 'Lê', lastName: 'Văn Cường', email: 'levancuong@company.com', phone: '0912345680', dateOfBirth: new Date('1992-11-10'), gender: 'male' as const, address: '789 Đường DEF, Quận 7, TP.HCM', salary: 20000000, hireDate: new Date('2022-06-01'), status: 'active' as const },
  { firstName: 'Phạm', lastName: 'Thị Dung', email: 'phamthidung@company.com', phone: '0912345681', dateOfBirth: new Date('1993-04-25'), gender: 'female' as const, address: '321 Đường GHI, Quận 2, TP.HCM', salary: 18000000, hireDate: new Date('2022-08-15'), status: 'active' as const },
  
  // HR Department
  { firstName: 'Hoàng', lastName: 'Văn Em', email: 'hoangvanem@company.com', phone: '0912345682', dateOfBirth: new Date('1988-07-12'), gender: 'male' as const, address: '654 Đường JKL, Quận 1, TP.HCM', salary: 26000000, hireDate: new Date('2019-05-20'), status: 'active' as const },
  { firstName: 'Vũ', lastName: 'Thị Phương', email: 'vuthiphuong@company.com', phone: '0912345683', dateOfBirth: new Date('1991-09-30'), gender: 'female' as const, address: '987 Đường MNO, Quận 5, TP.HCM', salary: 15000000, hireDate: new Date('2021-09-01'), status: 'active' as const },
  { firstName: 'Đỗ', lastName: 'Văn Giang', email: 'dovangiang@company.com', phone: '0912345684', dateOfBirth: new Date('1994-12-05'), gender: 'male' as const, address: '147 Đường PQR, Quận 10, TP.HCM', salary: 16000000, hireDate: new Date('2023-01-10'), status: 'active' as const },
  
  // Sales Department
  { firstName: 'Bùi', lastName: 'Thị Hạnh', email: 'buithihanh@company.com', phone: '0912345685', dateOfBirth: new Date('1987-03-18'), gender: 'female' as const, address: '258 Đường STU, Quận 3, TP.HCM', salary: 32000000, hireDate: new Date('2018-07-01'), status: 'active' as const },
  { firstName: 'Ngô', lastName: 'Văn Khoa', email: 'ngovankhoa@company.com', phone: '0912345686', dateOfBirth: new Date('1990-06-22'), gender: 'male' as const, address: '369 Đường VWX, Quận 7, TP.HCM', salary: 22000000, hireDate: new Date('2020-11-15'), status: 'active' as const },
  { firstName: 'Đinh', lastName: 'Thị Lan', email: 'dinhthilan@company.com', phone: '0912345687', dateOfBirth: new Date('1995-01-14'), gender: 'female' as const, address: '741 Đường YZA, Quận 1, TP.HCM', salary: 15000000, hireDate: new Date('2023-03-20'), status: 'active' as const },
  
  // Finance Department
  { firstName: 'Lý', lastName: 'Văn Minh', email: 'lyvanminh@company.com', phone: '0912345688', dateOfBirth: new Date('1986-10-08'), gender: 'male' as const, address: '852 Đường BCD, Quận 4, TP.HCM', salary: 28000000, hireDate: new Date('2019-02-01'), status: 'active' as const },
  { firstName: 'Cao', lastName: 'Thị Nga', email: 'caothinga@company.com', phone: '0912345689', dateOfBirth: new Date('1989-02-28'), gender: 'female' as const, address: '963 Đường EFG, Quận 2, TP.HCM', salary: 24000000, hireDate: new Date('2020-04-10'), status: 'active' as const },
  { firstName: 'Võ', lastName: 'Văn Oanh', email: 'vovanoanh@company.com', phone: '0912345690', dateOfBirth: new Date('1992-08-17'), gender: 'male' as const, address: '159 Đường HIJ, Quận 6, TP.HCM', salary: 14000000, hireDate: new Date('2022-02-01'), status: 'active' as const },
  
  // Marketing Department
  { firstName: 'Dương', lastName: 'Thị Phượng', email: 'duongthiphuong@company.com', phone: '0912345691', dateOfBirth: new Date('1987-12-03'), gender: 'female' as const, address: '357 Đường KLM, Quận 1, TP.HCM', salary: 27000000, hireDate: new Date('2019-08-15'), status: 'active' as const },
  { firstName: 'Hồ', lastName: 'Văn Quang', email: 'hovanquang@company.com', phone: '0912345692', dateOfBirth: new Date('1993-05-19'), gender: 'male' as const, address: '486 Đường NOP, Quận 3, TP.HCM', salary: 16000000, hireDate: new Date('2021-12-01'), status: 'active' as const },
];

// Mapping employees to departments and positions (index based)
const employeeMapping = [
  // IT - 4 employees
  { deptIndex: 0, posIndex: 0 }, // Trưởng phòng IT
  { deptIndex: 0, posIndex: 1 }, // Senior Developer
  { deptIndex: 0, posIndex: 2 }, // Developer
  { deptIndex: 0, posIndex: 3 }, // DevOps
  
  // HR - 3 employees
  { deptIndex: 1, posIndex: 4 }, // Trưởng phòng HR
  { deptIndex: 1, posIndex: 5 }, // Chuyên viên HR
  { deptIndex: 1, posIndex: 6 }, // Tuyển dụng
  
  // Sales - 3 employees
  { deptIndex: 2, posIndex: 7 }, // Trưởng phòng Sales
  { deptIndex: 2, posIndex: 8 }, // Trưởng nhóm Sales
  { deptIndex: 2, posIndex: 9 }, // Nhân viên Sales
  
  // Finance - 3 employees
  { deptIndex: 3, posIndex: 10 }, // Trưởng phòng Finance
  { deptIndex: 3, posIndex: 11 }, // Kế toán trưởng
  { deptIndex: 3, posIndex: 12 }, // Kế toán viên
  
  // Marketing - 2 employees
  { deptIndex: 4, posIndex: 13 }, // Trưởng phòng Marketing
  { deptIndex: 4, posIndex: 14 }, // Chuyên viên Marketing
];

async function seedData() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hrm_db';
    
    console.log('🔄 Đang kết nối tới MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ Đã kết nối MongoDB\n');

    // Xóa dữ liệu cũ (optional - comment nếu muốn giữ lại)
    console.log('🗑️  Đang xóa dữ liệu cũ...');
    await Salary.deleteMany({});
    await Employee.deleteMany({});
    await Position.deleteMany({});
    await Department.deleteMany({});
    console.log('✅ Đã xóa dữ liệu cũ\n');

    // Tạo Departments
    console.log('📁 Đang tạo phòng ban...');
    const departments = [];
    for (const deptData of departmentsData) {
      const dept = await Department.create(deptData);
      departments.push(dept);
      console.log(`   ✅ ${dept.name}`);
    }
    console.log(`\n✅ Đã tạo ${departments.length} phòng ban\n`);

    // Tạo Positions với mapping đến departments
    console.log('💼 Đang tạo chức vụ...');
    const positions = [];
    let posIndex = 0;
    
    // IT positions (0-3)
    for (let i = 0; i < 4; i++) {
      const pos = await Position.create({
        ...positionsData[i],
        department: departments[0]._id,
        status: 'active',
      });
      positions.push(pos);
      console.log(`   ✅ ${pos.title} - ${departments[0].name}`);
      posIndex++;
    }
    
    // HR positions (4-6)
    for (let i = 4; i < 7; i++) {
      const pos = await Position.create({
        ...positionsData[i],
        department: departments[1]._id,
        status: 'active',
      });
      positions.push(pos);
      console.log(`   ✅ ${pos.title} - ${departments[1].name}`);
      posIndex++;
    }
    
    // Sales positions (7-9)
    for (let i = 7; i < 10; i++) {
      const pos = await Position.create({
        ...positionsData[i],
        department: departments[2]._id,
        status: 'active',
      });
      positions.push(pos);
      console.log(`   ✅ ${pos.title} - ${departments[2].name}`);
      posIndex++;
    }
    
    // Finance positions (10-12)
    for (let i = 10; i < 13; i++) {
      const pos = await Position.create({
        ...positionsData[i],
        department: departments[3]._id,
        status: 'active',
      });
      positions.push(pos);
      console.log(`   ✅ ${pos.title} - ${departments[3].name}`);
      posIndex++;
    }
    
    // Marketing positions (13-14)
    for (let i = 13; i < 15; i++) {
      const pos = await Position.create({
        ...positionsData[i],
        department: departments[4]._id,
        status: 'active',
      });
      positions.push(pos);
      console.log(`   ✅ ${pos.title} - ${departments[4].name}`);
      posIndex++;
    }
    
    console.log(`\n✅ Đã tạo ${positions.length} chức vụ\n`);

    // Tạo Employees
    console.log('👥 Đang tạo nhân viên...');
    const employees = [];
    for (let i = 0; i < employeesData.length; i++) {
      const empData = employeesData[i];
      const mapping = employeeMapping[i];
      
      // Generate employee ID
      const employeeId = `EMP${String(i + 1).padStart(5, '0')}`;
      
      const emp = await Employee.create({
        ...empData,
        employeeId,
        department: departments[mapping.deptIndex]._id,
        position: positions[mapping.posIndex]._id,
        emergencyContact: {
          name: `${empData.firstName} ${empData.lastName} (Người thân)`,
          relationship: 'Người thân',
          phone: `0${Math.floor(Math.random() * 900000000) + 100000000}`,
        },
      });
      employees.push(emp);
      console.log(`   ✅ ${employeeId} - ${emp.firstName} ${emp.lastName} - ${departments[mapping.deptIndex].name}`);
    }
    console.log(`\n✅ Đã tạo ${employees.length} nhân viên\n`);

    // Cập nhật manager cho departments (gán trưởng phòng làm manager)
    console.log('👨‍💼 Đang gán trưởng phòng...');
    const managers = [
      employees[0],  // IT manager
      employees[4],  // HR manager
      employees[7],  // Sales manager
      employees[10], // Finance manager
      employees[13], // Marketing manager
    ];
    
    for (let i = 0; i < departments.length; i++) {
      await Department.findByIdAndUpdate(departments[i]._id, {
        manager: managers[i]._id,
      });
      console.log(`   ✅ ${departments[i].name} - ${managers[i].firstName} ${managers[i].lastName}`);
    }
    console.log('\n✅ Đã gán trưởng phòng\n');

    // Tạo Salaries cho 3 tháng gần nhất
    console.log('💰 Đang tạo bảng lương...');
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    let salaryCount = 0;
    for (const employee of employees) {
      // Tạo lương cho 3 tháng gần nhất
      for (let monthOffset = 2; monthOffset >= 0; monthOffset--) {
        let month = currentMonth - monthOffset;
        let year = currentYear;
        
        if (month <= 0) {
          month += 12;
          year -= 1;
        }
        
        const baseSalary = employee.salary;
        const housingAllowance = Math.floor(baseSalary * 0.1); // 10% housing
        const transportationAllowance = 500000; // 500k
        const mealAllowance = 730000; // 730k (bữa trưa)
        
        // Tính thuế (10% trên lương > 11 triệu)
        const taxableIncome = baseSalary + housingAllowance + transportationAllowance + mealAllowance;
        const tax = taxableIncome > 11000000 ? Math.floor((taxableIncome - 11000000) * 0.1) : 0;
        
        // Bảo hiểm (10.5% lương cơ bản)
        const insurance = Math.floor(baseSalary * 0.105);
        
        const netSalary = baseSalary + housingAllowance + transportationAllowance + mealAllowance - tax - insurance;
        
        // Tạo payment date (ngày 5 của tháng sau)
        const paymentDate = new Date(year, month - 1, 5); // month - 1 vì Date month là 0-indexed
        
        const salary = await Salary.create({
          employee: employee._id,
          baseSalary,
          allowances: {
            housing: housingAllowance,
            transportation: transportationAllowance,
            meal: mealAllowance,
            other: 0,
          },
          deductions: {
            tax,
            insurance,
            other: 0,
          },
          month,
          year,
          netSalary,
          paymentDate,
          status: monthOffset === 0 ? 'pending' : 'paid', // Tháng hiện tại pending, các tháng trước paid
        });
        salaryCount++;
      }
    }
    console.log(`\n✅ Đã tạo ${salaryCount} bảng lương (3 tháng cho mỗi nhân viên)\n`);

    // Tóm tắt
    console.log('═══════════════════════════════════════════════');
    console.log('📊 TÓM TẮT DỮ LIỆU ĐÃ TẠO:');
    console.log('═══════════════════════════════════════════════');
    console.log(`📁 Phòng ban: ${departments.length}`);
    console.log(`💼 Chức vụ: ${positions.length}`);
    console.log(`👥 Nhân viên: ${employees.length}`);
    console.log(`💰 Bảng lương: ${salaryCount}`);
    console.log('═══════════════════════════════════════════════\n');

  } catch (error: any) {
    console.error('❌ Lỗi:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Đã đóng kết nối MongoDB');
  }
}

seedData();


