import { Request, Response } from 'express';
import AuditLog from '../models/AuditLog';

export const createAuditLog = async (req: Request, res: Response): Promise<void> => {
  try {
    const { module, action, entityId, actor, metadata } = req.body || {};

    if (!module || !action) {
      res.status(400).json({ message: 'module and action are required' });
      return;
    }

    const log = await AuditLog.create({
      module,
      action,
      entityId,
      actor,
      metadata,
    });

    res.status(201).json({ success: true, data: log });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Create audit log failed' });
  }
};

export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { module, action, actorEmail, limit = 50 } = req.query as {
      module?: string;
      action?: string;
      actorEmail?: string;
      limit?: string;
    };

    const query: any = {};
    if (module) query.module = module;
    if (action) query.action = action;
    if (actorEmail) query['actor.email'] = actorEmail;

    const logs = await AuditLog.find(query)
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit) || 50, 200));

    res.json({ success: true, data: logs });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Fetch audit logs failed' });
  }
};

