import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Employee from '../models/Employee';
import Department from '../models/Department';
import Position from '../models/Position';
import Salary from '../models/Salary';
import Attendance from '../models/Attendance';
import Leave from '../models/Leave';
import User from '../models/User';
import mongoose from 'mongoose';

export const getEmployees = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, department, status, search } = req.query;
    const query: any = {};

    if (department) query.department = department;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
      ];
    }

    const employees = await Employee.find(query)
      .populate('department', 'name')
      .populate({
        path: 'position',
        select: 'title status',
        // Không dùng match vì có thể position đã bị xóa nhưng employee vẫn reference
      })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    const total = await Employee.countDocuments(query);

    res.json({
      success: true,
      data: employees,
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

export const getEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ message: 'Invalid employee ID format' });
      return;
    }

    const employee = await Employee.findById(req.params.id)
      .populate('department')
      .populate('position');

    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    // Manager chỉ xem được nhân viên trong phòng ban của mình
    if (req.user.role === 'manager' && req.user.employeeId) {
      const managerEmployee = await Employee.findById(req.user.employeeId);
      if (managerEmployee && employee.department.toString() !== managerEmployee.department.toString()) {
        res.status(403).json({ message: 'Access denied. You can only view employees from your department.' });
        return;
      }
    } else if (req.user.role === 'employee' && req.user.employeeId) {
      // Employee chỉ xem được chính mình
      if (employee._id.toString() !== req.user.employeeId.toString()) {
        res.status(403).json({ message: 'Access denied. You can only view your own information.' });
        return;
      }
    }

    res.json({ success: true, data: employee });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Generate employee ID
    const count = await Employee.countDocuments();
    const employeeId = `EMP${String(count + 1).padStart(5, '0')}`;

    const employee = await Employee.create({
      ...req.body,
      employeeId,
    });

    const populated = await Employee.findById(employee._id)
      .populate('department', 'name')
      .populate('position', 'title');

    res.status(201).json({ success: true, data: populated });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ message: 'Invalid employee ID format' });
      return;
    }

    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('department', 'name')
      .populate('position', 'title');

    if (!employee) {
      res.status(404).json({ message: 'Employee not found' });
      return;
    }

    res.json({ success: true, data: employee });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteEmployee = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ 
        success: false,
        message: 'Invalid employee ID format' 
      });
      return;
    }

    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      res.status(404).json({ 
        success: false,
        message: 'Employee not found' 
      });
      return;
    }

    // Xóa tất cả dữ liệu liên quan trước khi xóa nhân viên
    const employeeId = employee._id;

    try {
      // 1. Xóa tất cả bảng lương của nhân viên
      const salaryResult = await Salary.deleteMany({ employee: employeeId });
      console.log(`Deleted ${salaryResult.deletedCount} salaries for employee ${employeeId}`);

      // 2. Xóa tất cả chấm công của nhân viên
      const attendanceResult = await Attendance.deleteMany({ employee: employeeId });
      console.log(`Deleted ${attendanceResult.deletedCount} attendances for employee ${employeeId}`);

      // 3. Xóa tất cả đơn nghỉ phép của nhân viên
      const leaveResult = await Leave.deleteMany({ employee: employeeId });
      console.log(`Deleted ${leaveResult.deletedCount} leaves for employee ${employeeId}`);

      // 4. Xóa hoặc cập nhật User account liên quan (nếu có)
      const userResult = await User.updateMany(
        { employeeId: employeeId },
        { $unset: { employeeId: '' } }
      );
      console.log(`Unlinked ${userResult.modifiedCount} user accounts for employee ${employeeId}`);

      // 5. Xóa manager khỏi các phòng ban (nếu nhân viên là manager)
      const deptResult = await Department.updateMany(
        { manager: employeeId },
        { $unset: { manager: '' } }
      );
      console.log(`Removed manager from ${deptResult.modifiedCount} departments for employee ${employeeId}`);

      // 6. Cuối cùng, xóa nhân viên
      const deletedEmployee = await Employee.findByIdAndDelete(employeeId);
      
      if (!deletedEmployee) {
        res.status(404).json({ 
          success: false,
          message: 'Employee not found or already deleted' 
        });
        return;
      }

      console.log(`Successfully deleted employee ${employeeId}`);
      
      res.json({ 
        success: true, 
        message: 'Employee and all related data deleted successfully' 
      });
    } catch (dbError: any) {
      console.error('Database error while deleting employee:', dbError);
      res.status(500).json({ 
        success: false,
        message: dbError.message || 'Failed to delete employee and related data' 
      });
    }
  } catch (error: any) {
    console.error('Error in deleteEmployee controller:', error);
    res.status(500).json({ 
      success: false,
      message: error.message || 'Failed to delete employee' 
    });
  }
};

export const getEmployeeStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const total = await Employee.countDocuments();
    const active = await Employee.countDocuments({ status: 'active' });
    const inactive = await Employee.countDocuments({ status: 'inactive' });
    const terminated = await Employee.countDocuments({ status: 'terminated' });

    const byDepartment = await Employee.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
      { $unwind: '$dept' },
      { $project: { name: '$dept.name', count: 1 } },
    ]);

    res.json({
      success: true,
      data: {
        total,
        active,
        inactive,
        terminated,
        byDepartment,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

