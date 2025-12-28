import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Announcement from '../models/Announcement';
import Employee from '../models/Employee';
import mongoose from 'mongoose';

export const getAnnouncements = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type, priority, status } = req.query;
    const query: any = { status: 'published' };

    if (type) query.type = type;
    if (priority) query.priority = priority;

    // Filter by target audience
    const user = req.user;
    if (user?.employeeId) {
      const employee = await Employee.findById(user.employeeId);
      if (employee && employee.department) {
        query.$or = [
          { targetAudience: 'all' },
          { targetAudience: employee.department },
        ];
      } else {
        query.targetAudience = 'all';
      }
    } else {
      query.targetAudience = 'all';
    }

    // Filter expired announcements
    const now = new Date();
    query.$or = [
      { expiryDate: { $exists: false } },
      { expiryDate: { $gt: now } },
    ];

    const announcements = await Announcement.find(query)
      .populate('createdBy', 'email')
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
      .populate('createdBy', 'email')
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

    const announcement = await Announcement.findById(req.params.id)
      .populate('createdBy', 'email');

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
    const populated = await Announcement.findById(announcement._id)
      .populate('createdBy', 'email');

    res.status(201).json({ success: true, data: populated });
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
    }).populate('createdBy', 'email');

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

