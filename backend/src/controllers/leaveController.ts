import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Leave from '../models/Leave';

export const getLeaves = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const leaves = await Leave.find()
      .populate('employee', 'firstName lastName email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: leaves });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getLeave = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const leave = await Leave.findById(req.params.id).populate('employee', 'firstName lastName email');
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
    const leave = await Leave.create(req.body);
    const populated = await Leave.findById(leave._id).populate('employee', 'firstName lastName email');
    res.status(201).json({ success: true, data: populated });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateLeave = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const leave = await Leave.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('employee', 'firstName lastName email');
    if (!leave) {
      res.status(404).json({ message: 'Leave not found' });
      return;
    }
    res.json({ success: true, data: leave });
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
    ).populate('employee', 'firstName lastName email');
    if (!leave) {
      res.status(404).json({ success: false, message: 'Leave not found' });
      return;
    }
    res.json({ success: true, data: leave });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteLeave = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const leave = await Leave.findByIdAndDelete(req.params.id);
    if (!leave) {
      res.status(404).json({ message: 'Leave not found' });
      return;
    }
    res.json({ success: true, message: 'Leave deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
