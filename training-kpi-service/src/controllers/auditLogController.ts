import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import AuditLog from '../models/AuditLog';

export const getAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { module, action, actorId, limit = 50 } = req.query;
    const query: any = {};

    if (module) query.module = module;
    if (action) query.action = action;
    if (actorId) query['actor.id'] = actorId;

    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit) || 50, 200));

    res.json({ success: true, data: logs });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to load audit logs' });
  }
};


