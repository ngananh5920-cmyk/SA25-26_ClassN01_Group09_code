import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Leave from '../models/Leave';
import { fetchEmployeesByIds } from '../utils/employeeClient';
import { createAuditLog } from '../utils/auditLogger';

export const getLeaves = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const query: any = {};

    // Non-admin/HR users only see their own leaves
    if (
      req.user?.role !== 'admin' &&
      req.user?.role !== 'hr' &&
      req.user?.employeeId
    ) {
      query.employee = req.user.employeeId;
    }

    const leaves = await Leave.find(query).sort({ createdAt: -1 });
    const employeeIds = Array.from(
      new Set(leaves.map((leave) => leave.employee?.toString()).filter(Boolean))
    );
    let employees: Record<string, any> = {};
    try {
      employees = await fetchEmployeesByIds(employeeIds, req.header('Authorization'));
    } catch (err: any) {
      console.warn('getLeaves: failed to fetch employee details', err?.message);
    }

    const data = leaves.map((leave) => ({
      ...leave.toObject(),
      employee: employees[leave.employee?.toString() || ''] || leave.employee,
    }));

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('getLeaves error:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

export const getLeave = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      res.status(404).json({ message: 'Leave not found' });
      return;
    }
    let employees: Record<string, any> = {};
    try {
      employees = await fetchEmployeesByIds(
        leave.employee ? [leave.employee.toString()] : [],
        req.header('Authorization')
      );
    } catch (err: any) {
      console.warn('getLeave: failed to fetch employee details', err?.message);
    }
    res.json({
      success: true,
      data: {
        ...leave.toObject(),
        employee: employees[leave.employee?.toString() || ''] || leave.employee,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createLeave = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const payload: any = { ...req.body };

    // For normal employees, always prefer their own employeeId
    if (req.user?.role !== 'admin' && req.user?.role !== 'hr') {
      if (req.user?.employeeId) {
        payload.employee = req.user.employeeId;
      } else if (!payload.employee) {
        // Fallback: allow employee to be provided in body, but require it
        res.status(400).json({ message: 'Employee is required' });
        return;
      }
    }

    const leave = await Leave.create(payload);
    const created = await Leave.findById(leave._id);
    if (!created) {
      res.status(201).json({ success: true, data: created });
      return;
    }

    let employees: Record<string, any> = {};
    try {
      employees = await fetchEmployeesByIds(
        created.employee ? [created.employee.toString()] : [],
        req.header('Authorization')
      );
    } catch (err: any) {
      console.warn('createLeave: failed to fetch employee details', err?.message);
    }
    res.status(201).json({
      success: true,
      data: {
        ...created.toObject(),
        employee: employees[created.employee?.toString() || ''] || created.employee,
      },
    });

    await createAuditLog(req, 'create', { type: 'leave', id: created._id.toString() }, {
      employee: created.employee?.toString(),
      leaveType: created.leaveType,
      startDate: created.startDate,
      endDate: created.endDate,
      status: created.status,
    });
  } catch (error: any) {
    console.error('createLeave error:', error);
    res.status(400).json({ message: error.message || 'Create leave failed' });
  }
};

export const updateLeave = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filter: any = { _id: req.params.id };

    // Employees can only update their own pending leaves
    if (req.user?.role !== 'admin' && req.user?.role !== 'hr') {
      if (!req.user?.employeeId) {
        res.status(403).json({ message: 'Access denied' });
        return;
      }
      filter.employee = req.user.employeeId;
      filter.status = 'pending';
    }

    const leave = await Leave.findOneAndUpdate(filter, req.body, {
      new: true,
      runValidators: true,
    });
    if (!leave) {
      res.status(404).json({ message: 'Leave not found' });
      return;
    }
    let employees: Record<string, any> = {};
    try {
      employees = await fetchEmployeesByIds(
        leave.employee ? [leave.employee.toString()] : [],
        req.header('Authorization')
      );
    } catch (err: any) {
      console.warn('updateLeave: failed to fetch employee details', err?.message);
    }
    res.json({
      success: true,
      data: {
        ...leave.toObject(),
        employee: employees[leave.employee?.toString() || ''] || leave.employee,
      },
    });

    await createAuditLog(req, 'update', { type: 'leave', id: leave._id.toString() }, {
      employee: leave.employee?.toString(),
      status: leave.status,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const approveLeave = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const leave = await Leave.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', approvedBy: req.user.id },
      { new: true, runValidators: true }
    );
    if (!leave) {
      res.status(404).json({ success: false, message: 'Leave not found' });
      return;
    }
    let employees: Record<string, any> = {};
    try {
      employees = await fetchEmployeesByIds(
        leave.employee ? [leave.employee.toString()] : [],
        req.header('Authorization')
      );
    } catch (err: any) {
      console.warn('approveLeave: failed to fetch employee details', err?.message);
    }
    res.json({
      success: true,
      data: {
        ...leave.toObject(),
        employee: employees[leave.employee?.toString() || ''] || leave.employee,
      },
    });

    await createAuditLog(req, 'approve', { type: 'leave', id: leave._id.toString() }, {
      employee: leave.employee?.toString(),
      status: leave.status,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteLeave = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const filter: any = { _id: req.params.id };

    // Employees can only delete their own pending leaves
    if (req.user?.role !== 'admin' && req.user?.role !== 'hr') {
      if (!req.user?.employeeId) {
        res.status(403).json({ message: 'Access denied' });
        return;
      }
      filter.employee = req.user.employeeId;
      filter.status = 'pending';
    }

    const leave = await Leave.findOneAndDelete(filter);
    if (!leave) {
      res.status(404).json({ message: 'Leave not found' });
      return;
    }
    res.json({ success: true, message: 'Leave deleted successfully' });

    await createAuditLog(req, 'delete', { type: 'leave', id: leave._id.toString() }, {
      employee: leave.employee?.toString(),
      status: leave.status,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
