import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Training, TrainingEnrollment } from '../models/Training';
import mongoose from 'mongoose';
import { fetchEmployeesByIds } from '../utils/employeeClient';
import { createAuditLog } from '../utils/auditLogger';

export const getTrainings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, type } = req.query;
    const query: any = {};

    if (status) query.status = status;
    if (type) query.type = type;

    const trainings = await Training.find(query)
      .sort({ startDate: 1 });

    res.json({ success: true, data: trainings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTraining = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid training ID format' });
      return;
    }

    const training = await Training.findById(req.params.id);

    if (!training) {
      res.status(404).json({ success: false, message: 'Training not found' });
      return;
    }

    const enrollments = await TrainingEnrollment.find({ training: training._id });

    const employeeIds = Array.from(
      new Set(enrollments.map((enrollment) => enrollment.employee?.toString()).filter(Boolean))
    );
    const employees = await fetchEmployeesByIds(employeeIds, req.header('Authorization'));
    const enrichedEnrollments = enrollments.map((enrollment) => ({
      ...enrollment.toObject(),
      employee: employees[enrollment.employee?.toString() || ''] || enrollment.employee,
    }));

    res.json({
      success: true,
      data: { ...training.toObject(), enrollments: enrichedEnrollments },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createTraining = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const training = await Training.create({
      ...req.body,
      createdBy: req.user.id,
    });
    const created = await Training.findById(training._id);
    if (!created) {
      res.status(201).json({ success: true, data: created });
      return;
    }
    res.status(201).json({ success: true, data: created });

    await createAuditLog(req, 'training', 'create', { type: 'training', id: created._id.toString() }, {
      title: created.title,
      status: created.status,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateTraining = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid training ID format' });
      return;
    }

    const training = await Training.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!training) {
      res.status(404).json({ success: false, message: 'Training not found' });
      return;
    }

    res.json({ success: true, data: training });

    await createAuditLog(req, 'training', 'update', { type: 'training', id: training._id.toString() }, {
      title: training.title,
      status: training.status,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteTraining = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid training ID format' });
      return;
    }

    // Delete related enrollments
    await TrainingEnrollment.deleteMany({ training: req.params.id });

    const training = await Training.findByIdAndDelete(req.params.id);
    if (!training) {
      res.status(404).json({ success: false, message: 'Training not found' });
      return;
    }

    res.json({ success: true, message: 'Training and all enrollments deleted successfully' });

    await createAuditLog(req, 'training', 'delete', { type: 'training', id: req.params.id }, {});
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Enrollment operations
export const enrollTraining = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { trainingId } = req.params;
    const employeeId = req.user.employeeId || req.body.employee;

    if (!employeeId) {
      res.status(400).json({ success: false, message: 'Employee ID is required' });
      return;
    }

    // Check if already enrolled
    const existing = await TrainingEnrollment.findOne({
      training: trainingId,
      employee: employeeId,
    });

    if (existing) {
      res.status(400).json({ success: false, message: 'Already enrolled in this training' });
      return;
    }

    const enrollment = await TrainingEnrollment.create({
      training: trainingId,
      employee: employeeId,
    });

    const created = await TrainingEnrollment.findById(enrollment._id);
    res.status(201).json({ success: true, data: created });

    await createAuditLog(req, 'training', 'enroll', { type: 'training', id: trainingId }, {
      employee: employeeId,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateEnrollment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid enrollment ID format' });
      return;
    }

    const enrollment = await TrainingEnrollment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!enrollment) {
      res.status(404).json({ success: false, message: 'Enrollment not found' });
      return;
    }

    const employees = await fetchEmployeesByIds(
      enrollment.employee ? [enrollment.employee.toString()] : [],
      req.header('Authorization')
    );
    res.json({
      success: true,
      data: {
        ...enrollment.toObject(),
        employee: employees[enrollment.employee?.toString() || ''] || enrollment.employee,
      },
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getMyTrainings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user.employeeId) {
      res.status(400).json({ success: false, message: 'Employee ID not found' });
      return;
    }

    const enrollments = await TrainingEnrollment.find({ employee: req.user.employeeId })
      .sort({ enrolledDate: -1 });

    const employeeIds = Array.from(
      new Set(enrollments.map((enrollment) => enrollment.employee?.toString()).filter(Boolean))
    );
    const employees = await fetchEmployeesByIds(employeeIds, req.header('Authorization'));
    const enriched = enrollments.map((enrollment) => ({
      ...enrollment.toObject(),
      employee: employees[enrollment.employee?.toString() || ''] || enrollment.employee,
    }));
    res.json({ success: true, data: enriched });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};


