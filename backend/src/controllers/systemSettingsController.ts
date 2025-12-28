import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import SystemSettings from '../models/SystemSettings';

export const getSettings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category } = req.query;
    const query: any = {};

    if (category) query.category = category;

    const settings = await SystemSettings.find(query).sort({ category: 1, key: 1 });
    
    // Convert to object format for easier access
    const settingsObj: Record<string, any> = {};
    settings.forEach((setting) => {
      settingsObj[setting.key] = setting.value;
    });

    res.json({ success: true, data: settingsObj, raw: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSetting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const setting = await SystemSettings.findOne({ key: req.params.key });
    if (!setting) {
      res.status(404).json({ success: false, message: 'Setting not found' });
      return;
    }
    res.json({ success: true, data: setting });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const setSetting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { key, value, type, category, description } = req.body;

    const setting = await SystemSettings.findOneAndUpdate(
      { key },
      { value, type, category, description },
      { upsert: true, new: true, runValidators: true }
    );

    res.json({ success: true, data: setting });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteSetting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const setting = await SystemSettings.findOneAndDelete({ key: req.params.key });
    if (!setting) {
      res.status(404).json({ success: false, message: 'Setting not found' });
      return;
    }
    res.json({ success: true, message: 'Setting deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

