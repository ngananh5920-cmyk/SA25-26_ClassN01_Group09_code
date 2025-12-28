import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Employee from '../models/Employee';
import Contract from '../models/Contract';
import Leave from '../models/Leave';
import Department from '../models/Department';
import { format, addDays, isAfter, isBefore, differenceInDays } from 'date-fns';

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const today = new Date();
    const thirtyDaysFromNow = addDays(today, 30);
    const sevenDaysFromNow = addDays(today, 7);

    // Get all employees
    const employees = await Employee.find()
      .populate('department', 'name')
      .populate('position', 'title name');

    // Get contracts
    const contracts = await Contract.find({ status: 'active' })
      .populate('employee', 'firstName lastName email')
      .populate('department', 'name');

    // Get pending leaves
    const pendingLeaves = await Leave.find({ status: 'pending' })
      .populate('employee', 'firstName lastName email');

    // Calculate statistics
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter((e) => e.status === 'active').length;
    const inactiveEmployees = employees.filter((e) => e.status === 'inactive').length;
    const terminatedEmployees = employees.filter((e) => e.status === 'terminated').length;

    // Department distribution
    const departmentCount: Record<string, number> = {};
    employees.forEach((emp: any) => {
      const deptName = emp.department?.name || 'Chưa phân phòng';
      departmentCount[deptName] = (departmentCount[deptName] || 0) + 1;
    });

    const departmentChart = Object.entries(departmentCount).map(([name, count]) => ({
      name,
      value: count,
    }));

    // Expiring contracts (within 30 days)
    const expiringContracts = contracts.filter((contract: any) => {
      if (!contract.endDate) return false;
      const endDate = new Date(contract.endDate);
      return isAfter(endDate, today) && isBefore(endDate, thirtyDaysFromNow);
    }).map((contract: any) => ({
      _id: contract._id,
      employee: contract.employee,
      endDate: contract.endDate,
      daysRemaining: differenceInDays(new Date(contract.endDate), today),
      department: contract.department,
    }));

    // Upcoming birthdays (within 7 days)
    const upcomingBirthdays = employees
      .filter((emp) => {
        if (!emp.dateOfBirth) return false;
        const birthDate = new Date(emp.dateOfBirth);
        const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
        const nextYearBirthday = new Date(today.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate());
        
        let targetBirthday = thisYearBirthday;
        if (isBefore(thisYearBirthday, today)) {
          targetBirthday = nextYearBirthday;
        }
        
        return isAfter(targetBirthday, today) && isBefore(targetBirthday, sevenDaysFromNow);
      })
      .map((emp: any) => {
        const birthDate = new Date(emp.dateOfBirth);
        const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
        const nextYearBirthday = new Date(today.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate());
        
        let targetBirthday = thisYearBirthday;
        if (isBefore(thisYearBirthday, today)) {
          targetBirthday = nextYearBirthday;
        }
        
        return {
          _id: emp._id,
          firstName: emp.firstName,
          lastName: emp.lastName,
          email: emp.email,
          dateOfBirth: emp.dateOfBirth,
          birthday: targetBirthday,
          daysUntil: differenceInDays(targetBirthday, today),
          department: emp.department,
        };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil);

    // Leave status
    const leaveStatusCount = {
      pending: pendingLeaves.length,
      approved: 0,
      rejected: 0,
    };

    const allLeaves = await Leave.find();
    leaveStatusCount.approved = allLeaves.filter((l) => l.status === 'approved').length;
    leaveStatusCount.rejected = allLeaves.filter((l) => l.status === 'rejected').length;

    res.json({
      success: true,
      data: {
        totalEmployees,
        activeEmployees,
        inactiveEmployees,
        terminatedEmployees,
        totalDepartments: await Department.countDocuments(),
        pendingLeaves: leaveStatusCount.pending,
        approvedLeaves: leaveStatusCount.approved,
        rejectedLeaves: leaveStatusCount.rejected,
        departmentChart,
        expiringContracts,
        upcomingBirthdays,
        leaveStatusData: [
          { name: 'Chờ duyệt', value: leaveStatusCount.pending },
          { name: 'Đã duyệt', value: leaveStatusCount.approved },
          { name: 'Từ chối', value: leaveStatusCount.rejected },
        ],
      },
    });
  } catch (error: any) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


