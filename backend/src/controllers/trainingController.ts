import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Training, TrainingEnrollment } from '../models/Training';
import mongoose from 'mongoose';

export const getTrainings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, type } = req.query;
    const query: any = {};

    if (status) query.status = status;
    if (type) query.type = type;

    const trainings = await Training.find(query)
      .populate('createdBy', 'email')
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

    const training = await Training.findById(req.params.id)
      .populate('createdBy', 'email');

    if (!training) {
      res.status(404).json({ success: false, message: 'Training not found' });
      return;
    }

    const enrollments = await TrainingEnrollment.find({ training: training._id })
      .populate('employee', 'firstName lastName email employeeId');

    res.json({ success: true, data: { ...training.toObject(), enrollments } });
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
    const populated = await Training.findById(training._id)
      .populate('createdBy', 'email');

    res.status(201).json({ success: true, data: populated });
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
    }).populate('createdBy', 'email');

    if (!training) {
      res.status(404).json({ success: false, message: 'Training not found' });
      return;
    }

    res.json({ success: true, data: training });
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

    const populated = await TrainingEnrollment.findById(enrollment._id)
      .populate('training', 'title')
      .populate('employee', 'firstName lastName email employeeId');

    res.status(201).json({ success: true, data: populated });
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
    })
      .populate('training', 'title')
      .populate('employee', 'firstName lastName email employeeId');

    if (!enrollment) {
      res.status(404).json({ success: false, message: 'Enrollment not found' });
      return;
    }

    res.json({ success: true, data: enrollment });
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
      .populate('training')
      .sort({ enrolledDate: -1 });

    res.json({ success: true, data: enrollments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};


