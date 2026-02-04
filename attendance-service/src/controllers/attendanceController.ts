import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Attendance from '../models/Attendance';
import { fetchEmployeeIdsByDepartment } from '../utils/employeeClient';

const parseDate = (value?: string): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const startOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfWeek = (date: Date): Date => {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
};

export const getAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const startParam = parseDate(req.query.start as string);
    const endParam = parseDate(req.query.end as string);
    const employeeIdParam = req.query.employeeId as string | undefined;
    const statusParam = req.query.status as
      | 'on_time'
      | 'late'
      | 'early'
      | 'absent'
      | 'leave'
      | undefined;
    const departmentIdParam = req.query.departmentId as string | undefined;

    const baseDate = startParam || new Date();
    const startDate = startParam || startOfWeek(baseDate);
    const endDate = endParam || endOfWeek(baseDate);

    const query: any = {
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    if (statusParam) {
      query.status = statusParam;
    }

    if (req.user?.role !== 'admin' && req.user?.employeeId) {
      query.employee = req.user.employeeId;
    } else if (req.user?.role === 'admin' && employeeIdParam) {
      query.employee = employeeIdParam;
    } else if (req.user?.role === 'admin' && departmentIdParam) {
      const employeeIds = await fetchEmployeeIdsByDepartment(departmentIdParam);
      if (employeeIds.length === 0) {
        res.json({ success: true, data: [] });
        return;
      }
      query.employee = { $in: employeeIds };
    }

    const attendance = await Attendance.find(query).sort({ date: 1, startTime: 1 });
    res.json({ success: true, data: attendance });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const attendance = await Attendance.create(req.body);
    res.status(201).json({ success: true, data: attendance });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};


