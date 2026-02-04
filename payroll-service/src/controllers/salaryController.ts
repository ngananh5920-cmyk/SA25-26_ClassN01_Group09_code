import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Salary from '../models/Salary';
import { fetchEmployeesByIds } from '../utils/employeeClient';
import { createAuditLog } from '../utils/auditLogger';

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
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit))
      .sort({ year: -1, month: -1 });

    const total = await Salary.countDocuments(query);

    const employeeIds = Array.from(
      new Set(salaries.map((salary) => salary.employee?.toString()).filter(Boolean))
    );
    const employees = await fetchEmployeesByIds(employeeIds, req.header('Authorization'));
    const enriched = salaries.map((salary) => ({
      ...salary.toObject(),
      employee: employees[salary.employee?.toString() || ''] || salary.employee,
    }));

    res.json({
      success: true,
      data: enriched,
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
    const salary = await Salary.findById(req.params.id);

    if (!salary) {
      res.status(404).json({ message: 'Salary not found' });
      return;
    }

    const employees = await fetchEmployeesByIds(
      salary.employee ? [salary.employee.toString()] : [],
      req.header('Authorization')
    );
    res.json({
      success: true,
      data: {
        ...salary.toObject(),
        employee: employees[salary.employee?.toString() || ''] || salary.employee,
      },
    });
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
    const created = await Salary.findById(salary._id);
    if (!created) {
      res.status(201).json({ success: true, data: created });
      return;
    }
    const employees = await fetchEmployeesByIds(
      created.employee ? [created.employee.toString()] : [],
      req.header('Authorization')
    );
    res.status(201).json({
      success: true,
      data: {
        ...created.toObject(),
        employee: employees[created.employee?.toString() || ''] || created.employee,
      },
    });

    await createAuditLog(req, 'create', { type: 'salary', id: created._id.toString() }, {
      employee: created.employee?.toString(),
      month: created.month,
      year: created.year,
      status: created.status,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateSalary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const salary = await Salary.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!salary) {
      res.status(404).json({ message: 'Salary not found' });
      return;
    }

    const employees = await fetchEmployeesByIds(
      salary.employee ? [salary.employee.toString()] : [],
      req.header('Authorization')
    );
    res.json({
      success: true,
      data: {
        ...salary.toObject(),
        employee: employees[salary.employee?.toString() || ''] || salary.employee,
      },
    });

    await createAuditLog(req, 'update', { type: 'salary', id: salary._id.toString() }, {
      employee: salary.employee?.toString(),
      month: salary.month,
      year: salary.year,
      status: salary.status,
    });
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

    await createAuditLog(req, 'delete', { type: 'salary', id: salary._id.toString() }, {
      employee: salary.employee?.toString(),
      month: salary.month,
      year: salary.year,
      status: salary.status,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const processPayroll = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await createAuditLog(req, 'process', { type: 'salary', id: 'batch' }, {
      month: req.body?.month,
      year: req.body?.year,
    });
    res.status(501).json({
      success: false,
      message: 'Payroll batch processing must be handled via employee-service integration.',
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};





