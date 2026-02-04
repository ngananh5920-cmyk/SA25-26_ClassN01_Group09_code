import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Holiday from '../models/Holiday';
import mongoose from 'mongoose';

export const getHolidays = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { year, type } = req.query;
    const query: any = {};

    if (year) {
      const startDate = new Date(Number(year), 0, 1);
      const endDate = new Date(Number(year), 11, 31);
      query.date = { $gte: startDate, $lte: endDate };
    }
    if (type) query.type = type;

    const holidays = await Holiday.find(query).sort({ date: 1 });

    res.json({ success: true, data: holidays });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getHoliday = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid holiday ID format' });
      return;
    }

    const holiday = await Holiday.findById(req.params.id);
    if (!holiday) {
      res.status(404).json({ success: false, message: 'Holiday not found' });
      return;
    }
    res.json({ success: true, data: holiday });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createHoliday = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const holiday = await Holiday.create(req.body);
    res.status(201).json({ success: true, data: holiday });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateHoliday = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid holiday ID format' });
      return;
    }

    const holiday = await Holiday.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!holiday) {
      res.status(404).json({ success: false, message: 'Holiday not found' });
      return;
    }
    res.json({ success: true, data: holiday });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteHoliday = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid holiday ID format' });
      return;
    }

    const holiday = await Holiday.findByIdAndDelete(req.params.id);
    if (!holiday) {
      res.status(404).json({ success: false, message: 'Holiday not found' });
      return;
    }
    res.json({ success: true, message: 'Holiday deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};


