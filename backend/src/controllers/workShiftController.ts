import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import WorkShift from '../models/WorkShift';
import mongoose from 'mongoose';

export const getWorkShifts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const shifts = await WorkShift.find().sort({ startTime: 1 });
    res.json({ success: true, data: shifts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getWorkShift = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid shift ID format' });
      return;
    }

    const shift = await WorkShift.findById(req.params.id);
    if (!shift) {
      res.status(404).json({ success: false, message: 'Work shift not found' });
      return;
    }
    res.json({ success: true, data: shift });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createWorkShift = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const shift = await WorkShift.create(req.body);
    res.status(201).json({ success: true, data: shift });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateWorkShift = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid shift ID format' });
      return;
    }

    const shift = await WorkShift.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!shift) {
      res.status(404).json({ success: false, message: 'Work shift not found' });
      return;
    }
    res.json({ success: true, data: shift });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteWorkShift = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid shift ID format' });
      return;
    }

    const shift = await WorkShift.findByIdAndDelete(req.params.id);
    if (!shift) {
      res.status(404).json({ success: false, message: 'Work shift not found' });
      return;
    }
    res.json({ success: true, message: 'Work shift deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

