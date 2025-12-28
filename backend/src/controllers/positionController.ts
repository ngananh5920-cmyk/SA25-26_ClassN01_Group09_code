import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Position from '../models/Position';

export const getPositions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const positions = await Position.find().populate('department', 'name').sort({ title: 1 });
    res.json({ success: true, data: positions });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getPosition = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const position = await Position.findById(req.params.id);
    if (!position) {
      res.status(404).json({ message: 'Position not found' });
      return;
    }
    res.json({ success: true, data: position });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createPosition = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const position = await Position.create(req.body);
    res.status(201).json({ success: true, data: position });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updatePosition = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const position = await Position.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!position) {
      res.status(404).json({ message: 'Position not found' });
      return;
    }
    res.json({ success: true, data: position });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deletePosition = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const position = await Position.findByIdAndDelete(req.params.id);
    if (!position) {
      res.status(404).json({ message: 'Position not found' });
      return;
    }
    res.json({ success: true, message: 'Position deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
