import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Announcement from '../models/Announcement';
import mongoose from 'mongoose';
import { fetchEmployeeDepartment } from '../utils/employeeClient';

export const getAnnouncements = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, priority, status } = req.query;
    const query: any = { status: 'published' };

    if (type) query.type = type;
    if (priority) query.priority = priority;

    const user = req.user;
    if (user?.employeeId) {
      const departmentId = await fetchEmployeeDepartment(
        user.employeeId.toString(),
        req.header('Authorization')
      );
      if (departmentId) {
        query.$or = [
          { targetAudience: 'all' },
          { targetAudience: departmentId },
          { targetAudience: { $in: [departmentId] } },
        ];
      } else {
        query.targetAudience = 'all';
      }
    } else {
      query.targetAudience = 'all';
    }

    // Filter expired announcements - combine with $and if $or exists
    const now = new Date();
    const expiryConditions = [
      { expiryDate: { $exists: false } },
      { expiryDate: { $gt: now } },
    ];

    if (query.$or) {
      query.$and = [
        { $or: query.$or },
        { $or: expiryConditions },
      ];
      delete query.$or;
    } else {
      query.$or = expiryConditions;
    }

    const announcements = await Announcement.find(query)
      .sort({ publishDate: -1 });

    res.json({ success: true, data: announcements });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllAnnouncements = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Admin/HR can see all including drafts
    const { type, priority, status } = req.query;
    const query: any = {};

    if (type) query.type = type;
    if (priority) query.priority = priority;
    if (status) query.status = status;

    const announcements = await Announcement.find(query)
      .sort({ publishDate: -1 });

    res.json({ success: true, data: announcements });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAnnouncement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid announcement ID format' });
      return;
    }

    const announcement = await Announcement.findById(req.params.id);

    if (!announcement) {
      res.status(404).json({ success: false, message: 'Announcement not found' });
      return;
    }

    res.json({ success: true, data: announcement });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createAnnouncement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const announcement = await Announcement.create({
      ...req.body,
      createdBy: req.user.id,
    });
    res.status(201).json({ success: true, data: announcement });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateAnnouncement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid announcement ID format' });
      return;
    }

    const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!announcement) {
      res.status(404).json({ success: false, message: 'Announcement not found' });
      return;
    }

    res.json({ success: true, data: announcement });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteAnnouncement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      res.status(400).json({ success: false, message: 'Invalid announcement ID format' });
      return;
    }

    const announcement = await Announcement.findByIdAndDelete(req.params.id);
    if (!announcement) {
      res.status(404).json({ success: false, message: 'Announcement not found' });
      return;
    }

    res.json({ success: true, message: 'Announcement deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};


