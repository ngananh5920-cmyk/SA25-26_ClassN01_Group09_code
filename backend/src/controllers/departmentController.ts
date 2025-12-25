import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Department from '../models/Department';
import Employee from '../models/Employee';

export const getDepartments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const departments = await Department.find()
      .populate('manager', 'firstName lastName email employeeId')
      .sort({ name: 1 });

    res.json({ success: true, data: departments });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const department = await Department.findById(req.params.id).populate(
      'manager',
      'firstName lastName email employeeId'
    );

    if (!department) {
      res.status(404).json({ message: 'Department not found' });
      return;
    }

    // Get employees in this department
    const employees = await Employee.find({ department: department._id })
      .select('firstName lastName email employeeId position status')
      .populate('position', 'title');

    res.json({
      success: true,
      data: {
        ...department.toObject(),
        employees,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const department = await Department.create(req.body);
    const populated = await Department.findById(department._id).populate(
      'manager',
      'firstName lastName email employeeId'
    );

    res.status(201).json({ success: true, data: populated });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const department = await Department.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('manager', 'firstName lastName email employeeId');

    if (!department) {
      res.status(404).json({ message: 'Department not found' });
      return;
    }

    res.json({ success: true, data: department });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteDepartment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Check if department has employees
    const employeesCount = await Employee.countDocuments({ department: req.params.id });
    if (employeesCount > 0) {
      res.status(400).json({
        message: `Cannot delete department. It has ${employeesCount} employee(s).`,
      });
      return;
    }

    const department = await Department.findByIdAndDelete(req.params.id);

    if (!department) {
      res.status(404).json({ message: 'Department not found' });
      return;
    }

    res.json({ success: true, message: 'Department deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};


