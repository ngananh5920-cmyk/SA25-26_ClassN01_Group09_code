import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Employee from '../models/Employee';
import Salary from '../models/Salary';
import Leave from '../models/Leave';
import User from '../models/User';
import Department from '../models/Department';
import mongoose from 'mongoose';

export const getEmployees = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employees = await Employee.find()
      .populate('department', 'name')
      .populate('position', 'title name')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: employees });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate('department', 'name')
      .populate('position', 'title name');
    if (!employee) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }
    res.json({ success: true, data: employee });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employee = await Employee.create(req.body);
    const populated = await Employee.findById(employee._id)
      .populate('department', 'name')
      .populate('position', 'title name');
    res.status(201).json({ success: true, data: populated });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('department', 'name')
      .populate('position', 'title name');
    if (!employee) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }
    res.json({ success: true, data: employee });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid employee ID format' });
      return;
    }

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }

    const employeeId = employee._id;

    // Delete related data: Salaries
    await Salary.deleteMany({ employee: employeeId });
    console.log(`Deleted salaries for employee ${employeeId}`);

    // Delete related data: Leaves
    await Leave.deleteMany({ employee: employeeId });
    console.log(`Deleted leaves for employee ${employeeId}`);

    // Unlink User accounts
    await User.updateMany(
      { employeeId: employeeId },
      { $unset: { employeeId: '' } }
    );
    console.log(`Unlinked user accounts for employee ${employeeId}`);

    // Remove employee as manager from departments
    await Department.updateMany(
      { manager: employeeId },
      { $unset: { manager: '' } }
    );
    console.log(`Removed employee ${employeeId} as manager from departments`);

    // Delete the employee
    const deletedEmployee = await Employee.findByIdAndDelete(employeeId);
    if (!deletedEmployee) {
      console.error(`Failed to delete employee ${employeeId} after related data cleanup.`);
      res.status(500).json({ success: false, message: 'Failed to delete employee' });
      return;
    }

    res.json({
      success: true,
      message: 'Employee and all related data deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to delete employee' });
  }
};

export const getEmployeeStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const total = await Employee.countDocuments();
    const active = await Employee.countDocuments({ status: 'active' });
    const inactive = await Employee.countDocuments({ status: 'inactive' });
    const terminated = await Employee.countDocuments({ status: 'terminated' });
    res.json({
      success: true,
      data: { total, active, inactive, terminated },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
