import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Leave from '../models/Leave';
import Employee from '../models/Employee';
import User from '../models/User';
import { createNotification } from './notificationController';

const calculateDays = (startDate: Date, endDate: Date): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
};

export const getLeaves = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, employee, status, leaveType } = req.query;
    const query: any = {};

    if (employee) query.employee = employee;
    if (status) query.status = status;
    if (leaveType) query.leaveType = leaveType;

    // If user is employee, only show their leaves
    if (req.user.role === 'employee' && req.user.employeeId) {
      query.employee = req.user.employeeId;
    } else if (req.user.role === 'manager' && req.user.employeeId) {
      // Manager chỉ xem được leaves của nhân viên trong phòng ban của mình
      const managerEmployee = await Employee.findById(req.user.employeeId);
      if (managerEmployee) {
        const departmentEmployees = await Employee.find({ department: managerEmployee.department });
        query.employee = { $in: departmentEmployees.map(emp => emp._id) };
      } else {
        query._id = null; // Không có leave nào nếu không tìm thấy manager employee
      }
    }

    const leaves = await Leave.find(query)
      .populate('employee', 'firstName lastName email employeeId')
      .populate('approvedBy', 'firstName lastName email')
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    const total = await Leave.countDocuments(query);

    res.json({
      success: true,
      data: leaves,
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

export const getLeave = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate('employee')
      .populate('approvedBy', 'firstName lastName email');

    if (!leave) {
      res.status(404).json({ message: 'Leave not found' });
      return;
    }

    res.json({ success: true, data: leave });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createLeave = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.body;

    // Use employee from request if admin/hr, otherwise use from user
    const employeeId = req.body.employee || req.user.employeeId;

    if (!employeeId) {
      res.status(400).json({ message: 'Employee ID is required' });
      return;
    }

    const days = calculateDays(new Date(startDate), new Date(endDate));

    const leave = await Leave.create({
      ...req.body,
      employee: employeeId,
      days,
    });

    const populated = await Leave.findById(leave._id)
      .populate('employee', 'firstName lastName email employeeId')
      .populate('approvedBy', 'firstName lastName email');

    // Create notification for admins, HR, and managers
    const employee = await Employee.findById(employeeId);
    if (employee) {
      const notifyUsers = await User.find({
        role: { $in: ['admin', 'hr', 'manager'] },
      });

      for (const notifyUser of notifyUsers) {
        await createNotification(
          notifyUser._id.toString(),
          'leave_pending',
          'Đơn nghỉ phép mới',
          `${employee.firstName} ${employee.lastName} đã tạo đơn nghỉ phép mới`,
          `/leaves`,
          { leaveId: leave._id.toString() }
        );
      }
    }

    res.status(201).json({ success: true, data: populated });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateLeave = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      res.status(404).json({ message: 'Leave not found' });
      return;
    }

    // Employees can only update their own pending leaves
    if (req.user.role === 'employee') {
      if (leave.employee.toString() !== req.user.employeeId?.toString()) {
        res.status(403).json({ message: 'Access denied' });
        return;
      }
      if (leave.status !== 'pending') {
        res.status(400).json({ message: 'Cannot update non-pending leave' });
        return;
      }
    }

    // Recalculate days if dates changed
    if (req.body.startDate || req.body.endDate) {
      const startDate = req.body.startDate ? new Date(req.body.startDate) : leave.startDate;
      const endDate = req.body.endDate ? new Date(req.body.endDate) : leave.endDate;
      req.body.days = calculateDays(startDate, endDate);
    }

    const updated = await Leave.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('employee', 'firstName lastName email employeeId')
      .populate('approvedBy', 'firstName lastName email');

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const approveLeave = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, comments } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      res.status(400).json({ message: 'Status must be approved or rejected' });
      return;
    }

    const leave = await Leave.findById(req.params.id)
      .populate('employee');

    if (!leave) {
      res.status(404).json({ message: 'Leave not found' });
      return;
    }

    // Manager chỉ có thể duyệt leave của nhân viên trong phòng ban của mình
    if (req.user.role === 'manager' && req.user.employeeId) {
      const managerEmployee = await Employee.findById(req.user.employeeId);
      if (managerEmployee) {
        const leaveEmployee = await Employee.findById((leave.employee as any)._id);
        if (!leaveEmployee || leaveEmployee.department.toString() !== managerEmployee.department.toString()) {
          res.status(403).json({ message: 'You can only approve leaves from your department employees' });
          return;
        }
      }
    }

    const updated = await Leave.findByIdAndUpdate(
      req.params.id,
      {
        status,
        approvedBy: req.user.id,
        comments,
      },
      { new: true }
    )
      .populate('employee', 'firstName lastName email employeeId')
      .populate('approvedBy', 'firstName lastName email');

    // Create notification for employee
    const employee = await Employee.findById((leave.employee as any)._id);
    if (employee) {
      const employeeUser = await User.findOne({ employeeId: employee._id });
      if (employeeUser) {
        await createNotification(
          employeeUser._id.toString(),
          status === 'approved' ? 'leave_approved' : 'leave_rejected',
          status === 'approved' ? 'Đơn nghỉ phép được duyệt' : 'Đơn nghỉ phép bị từ chối',
          status === 'approved'
            ? `Đơn nghỉ phép của bạn đã được duyệt`
            : `Đơn nghỉ phép của bạn đã bị từ chối${comments ? `: ${comments}` : ''}`,
          `/leaves`,
          { leaveId: leave._id.toString() }
        );
      }
    }

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteLeave = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      res.status(404).json({ message: 'Leave not found' });
      return;
    }

    // Employees can only delete their own pending leaves
    if (req.user.role === 'employee') {
      if (leave.employee.toString() !== req.user.employeeId?.toString()) {
        res.status(403).json({ message: 'Access denied' });
        return;
      }
      if (leave.status !== 'pending') {
        res.status(400).json({ message: 'Cannot delete non-pending leave' });
        return;
      }
    }

    await Leave.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Leave deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

