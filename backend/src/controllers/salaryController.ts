import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Salary from '../models/Salary';
import Employee from '../models/Employee';

export const getSalaries = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, employee, month, year, status } = req.query;
    const query: any = {};

    if (employee) query.employee = employee;
    if (month) query.month = Number(month);
    if (year) query.year = Number(year);
    if (status) query.status = status;

    // If user is employee, only show their salaries
    if (req.user.role === 'employee' && req.user.employeeId) {
      query.employee = req.user.employeeId;
    }

    const salaries = await Salary.find(query)
      .populate('employee', 'firstName lastName email employeeId')
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit))
      .sort({ year: -1, month: -1 });

    const total = await Salary.countDocuments(query);

    res.json({
      success: true,
      data: salaries,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getSalary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const salary = await Salary.findById(req.params.id).populate('employee');

    if (!salary) {
      res.status(404).json({ message: 'Salary not found' });
      return;
    }

    res.json({ success: true, data: salary });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createSalary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Check if salary already exists for this employee, month, year
    const existing = await Salary.findOne({
      employee: req.body.employee,
      month: req.body.month,
      year: req.body.year,
    });

    if (existing) {
      res.status(400).json({
        message: 'Salary record already exists for this employee, month, and year',
      });
      return;
    }

    const salary = await Salary.create(req.body);
    const populated = await Salary.findById(salary._id).populate(
      'employee',
      'firstName lastName email employeeId'
    );

    res.status(201).json({ success: true, data: populated });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateSalary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const salary = await Salary.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('employee', 'firstName lastName email employeeId');

    if (!salary) {
      res.status(404).json({ message: 'Salary not found' });
      return;
    }

    res.json({ success: true, data: salary });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteSalary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const salary = await Salary.findByIdAndDelete(req.params.id);

    if (!salary) {
      res.status(404).json({ message: 'Salary not found' });
      return;
    }

    res.json({ success: true, message: 'Salary deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const processPayroll = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { month, year } = req.body;

    if (!month || !year) {
      res.status(400).json({ message: 'Month and year are required' });
      return;
    }

    // Get all active employees
    const employees = await Employee.find({ status: 'active' });

    const salaries = [];

    for (const employee of employees) {
      // Check if salary already exists
      const existing = await Salary.findOne({
        employee: employee._id,
        month,
        year,
      });

      if (!existing) {
        const salary = await Salary.create({
          employee: employee._id,
          baseSalary: employee.salary,
          month,
          year,
          allowances: {},
          deductions: {},
        });
        salaries.push(salary);
      }
    }

    res.json({
      success: true,
      message: `Payroll processed for ${salaries.length} employees`,
      data: salaries,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};


