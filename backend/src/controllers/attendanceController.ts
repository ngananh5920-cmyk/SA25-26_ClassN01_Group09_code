import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Attendance from '../models/Attendance';
import Employee from '../models/Employee';
import User from '../models/User';

// Check-in
export const checkIn = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let employeeId = req.user.employeeId;

    // Nếu chưa có employeeId, thử tìm employee theo email
    if (!employeeId) {
      const employee = await Employee.findOne({ email: req.user.email });
      if (employee) {
        // Tự động link employee với user
        await User.findByIdAndUpdate(req.user.id, { employeeId: employee._id });
        employeeId = employee._id;
      } else {
        res.status(400).json({ 
          message: 'Employee ID not found. Please link your account to an employee or ensure your email matches an employee email.' 
        });
        return;
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Kiểm tra xem đã check-in chưa
    const existing = await Attendance.findOne({
      employee: employeeId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    if (existing) {
      res.status(400).json({ message: 'Bạn đã check-in hôm nay rồi' });
      return;
    }

    const now = new Date();
    const checkInTime = new Date();
    checkInTime.setHours(9, 0, 0, 0); // Giờ check-in chuẩn: 9:00 AM

    let status: 'present' | 'late' = 'present';
    if (now > checkInTime) {
      status = 'late';
    }

    const attendance = await Attendance.create({
      employee: employeeId,
      date: today,
      checkIn: now,
      status,
      location: req.body.location,
    });

    const populated = await Attendance.findById(attendance._id)
      .populate('employee', 'firstName lastName email employeeId');

    res.status(201).json({
      success: true,
      data: populated,
      message: status === 'late' ? 'Check-in thành công (muộn)' : 'Check-in thành công',
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Check-out
export const checkOut = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let employeeId = req.user.employeeId;

    // Nếu chưa có employeeId, thử tìm employee theo email
    if (!employeeId) {
      const employee = await Employee.findOne({ email: req.user.email });
      if (employee) {
        await User.findByIdAndUpdate(req.user.id, { employeeId: employee._id });
        employeeId = employee._id;
      } else {
        res.status(400).json({ message: 'Employee ID not found' });
        return;
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employee: employeeId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    if (!attendance) {
      res.status(400).json({ message: 'Bạn chưa check-in hôm nay' });
      return;
    }

    if (attendance.checkOut) {
      res.status(400).json({ message: 'Bạn đã check-out hôm nay rồi' });
      return;
    }

    const now = new Date();
    attendance.checkOut = now;
    
    // Cập nhật location nếu có
    if (req.body.location) {
      attendance.location = req.body.location;
    }

    // Tính workHours
    const diffTime = now.getTime() - attendance.checkIn.getTime();
    attendance.workHours = Math.round((diffTime / (1000 * 60 * 60)) * 100) / 100;

    // Nếu làm việc < 4 giờ thì đánh dấu half-day
    if (attendance.workHours < 4) {
      attendance.status = 'half-day';
    }

    await attendance.save();

    const populated = await Attendance.findById(attendance._id)
      .populate('employee', 'firstName lastName email employeeId');

    res.json({
      success: true,
      data: populated,
      message: 'Check-out thành công',
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Lấy danh sách chấm công
export const getAttendances = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10, employee, startDate, endDate, status } = req.query;
    const query: any = {};

    // Employee chỉ xem được chấm công của mình
    if (req.user.role === 'employee') {
      let employeeId = req.user.employeeId;
      
      // Nếu chưa có employeeId, thử tìm theo email
      if (!employeeId) {
        const employeeByEmail = await Employee.findOne({ email: req.user.email });
        if (employeeByEmail) {
          await User.findByIdAndUpdate(req.user.id, { employeeId: employeeByEmail._id });
          employeeId = employeeByEmail._id;
        } else {
          // Nếu không tìm thấy employee, trả về danh sách rỗng
          res.json({
            success: true,
            data: [],
            pagination: {
              page: Number(page),
              limit: Number(limit),
              total: 0,
              pages: 0,
            },
          });
          return;
        }
      }
      query.employee = employeeId;
    } else if (employee) {
      query.employee = employee;
    } else if (req.user.role === 'manager' && req.user.employeeId) {
      // Manager xem được chấm công của nhân viên trong phòng ban
      const managerEmployee = await Employee.findById(req.user.employeeId);
      if (managerEmployee) {
        const departmentEmployees = await Employee.find({ department: managerEmployee.department });
        query.employee = { $in: departmentEmployees.map(emp => emp._id) };
      }
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate as string);
      }
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    if (status) {
      query.status = status;
    }

    const attendances = await Attendance.find(query)
      .populate('employee', 'firstName lastName email employeeId')
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit))
      .sort({ date: -1, checkIn: -1 });

    const total = await Attendance.countDocuments(query);

    res.json({
      success: true,
      data: attendances,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Error in getAttendances:', error);
    res.status(500).json({ 
      message: error.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};

// Lấy chi tiết chấm công
export const getAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const attendance = await Attendance.findById(req.params.id)
      .populate('employee', 'firstName lastName email employeeId');

    if (!attendance) {
      res.status(404).json({ message: 'Attendance not found' });
      return;
    }

    // Employee chỉ xem được chấm công của mình
    if (req.user.role === 'employee' && attendance.employee.toString() !== req.user.employeeId?.toString()) {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    res.json({ success: true, data: attendance });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Tạo chấm công (Admin/HR)
export const createAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { employee, date, checkIn, checkOut, status, notes } = req.body;

    const attendanceDate = date ? new Date(date) : new Date();
    attendanceDate.setHours(0, 0, 0, 0);

    // Kiểm tra xem đã có bản ghi chưa
    const existing = await Attendance.findOne({
      employee,
      date: {
        $gte: attendanceDate,
        $lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    if (existing) {
      res.status(400).json({ message: 'Attendance record already exists for this date' });
      return;
    }

    const attendance = await Attendance.create({
      employee,
      date: attendanceDate,
      checkIn: checkIn ? new Date(checkIn) : new Date(),
      checkOut: checkOut ? new Date(checkOut) : undefined,
      status: status || 'present',
      notes,
      location: req.body.location,
    });

    const populated = await Attendance.findById(attendance._id)
      .populate('employee', 'firstName lastName email employeeId');

    res.status(201).json({ success: true, data: populated });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Cập nhật chấm công
export const updateAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      res.status(404).json({ message: 'Attendance not found' });
      return;
    }

    // Employee chỉ có thể cập nhật check-out của mình
    if (req.user.role === 'employee') {
      if (attendance.employee.toString() !== req.user.employeeId?.toString()) {
        res.status(403).json({ message: 'Access denied' });
        return;
      }
      // Chỉ cho phép cập nhật checkOut và notes
      const allowedFields = ['checkOut', 'notes'];
      Object.keys(req.body).forEach(key => {
        if (!allowedFields.includes(key)) {
          delete req.body[key];
        }
      });
    }

    // Tính lại workHours nếu checkIn hoặc checkOut thay đổi
    if (req.body.checkIn || req.body.checkOut) {
      const checkIn = req.body.checkIn ? new Date(req.body.checkIn) : attendance.checkIn;
      const checkOut = req.body.checkOut ? new Date(req.body.checkOut) : attendance.checkOut;
      if (checkIn && checkOut) {
        const diffTime = checkOut.getTime() - checkIn.getTime();
        req.body.workHours = Math.round((diffTime / (1000 * 60 * 60)) * 100) / 100;
      }
    }

    const updated = await Attendance.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('employee', 'firstName lastName email employeeId');

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

// Xóa chấm công
export const deleteAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      res.status(404).json({ message: 'Attendance not found' });
      return;
    }

    // Employee không thể xóa chấm công
    if (req.user.role === 'employee') {
      res.status(403).json({ message: 'Access denied' });
      return;
    }

    await Attendance.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Attendance deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Thống kê chấm công
export const getStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { employee, startDate, endDate } = req.query;

    const query: any = {};

    if (req.user.role === 'employee' && req.user.employeeId) {
      query.employee = req.user.employeeId;
    } else if (employee) {
      query.employee = employee;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate as string);
      }
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const total = await Attendance.countDocuments(query);
    const present = await Attendance.countDocuments({ ...query, status: 'present' });
    const late = await Attendance.countDocuments({ ...query, status: 'late' });
    const absent = await Attendance.countDocuments({ ...query, status: 'absent' });
    const halfDay = await Attendance.countDocuments({ ...query, status: 'half-day' });

    // Tính tổng giờ làm việc
    const attendances = await Attendance.find({ ...query, workHours: { $exists: true, $ne: null } });
    const totalWorkHours = attendances.reduce((sum, att) => sum + (att.workHours || 0), 0);

    res.json({
      success: true,
      data: {
        total,
        present,
        late,
        absent,
        halfDay,
        totalWorkHours: Math.round(totalWorkHours * 100) / 100,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy trạng thái check-in hôm nay
export const getTodayStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let employeeId = req.user.employeeId;

    // Nếu chưa có employeeId, thử tìm employee theo email
    if (!employeeId) {
      const employee = await Employee.findOne({ email: req.user.email });
      if (employee) {
        await User.findByIdAndUpdate(req.user.id, { employeeId: employee._id });
        employeeId = employee._id;
      } else {
        res.json({
          success: true,
          data: null,
          canCheckIn: false,
          canCheckOut: false,
          message: 'Employee ID not found. Please link your account to an employee.',
        });
        return;
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employee: employeeId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
      },
    })
      .populate('employee', 'firstName lastName email employeeId');

    res.json({
      success: true,
      data: attendance || null,
      canCheckIn: !attendance,
      canCheckOut: attendance && !attendance.checkOut,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

