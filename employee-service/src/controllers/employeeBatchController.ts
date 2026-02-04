import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Employee from '../models/Employee';

export const getEmployeesBatch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const serviceKey = req.header('X-Service-Key');
    const expectedKey = process.env.SERVICE_KEY;
    const isServiceAuth = expectedKey && serviceKey === expectedKey;
    const isAdmin = req.user?.role === 'admin';

    if (!isServiceAuth && !isAdmin) {
      console.warn('getEmployeesBatch access denied', {
        hasServiceKeyHeader: !!serviceKey,
        serviceKey,
        expectedKey,
        userRole: req.user?.role,
      });
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    const { ids } = req.body as { ids?: string[] };
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ success: false, message: 'ids is required' });
      return;
    }

    const employees = await Employee.find({ _id: { $in: ids } })
      .populate('department', 'name')
      .populate('position', 'title name');

    res.json({ success: true, data: employees });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

