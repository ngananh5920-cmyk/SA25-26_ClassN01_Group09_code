import AuditLog from '../models/AuditLog';
import { AuthRequest } from '../middleware/auth';

export const createAuditLog = async (
  req: AuthRequest,
  action: string,
  target?: { type: string; id: string },
  metadata?: Record<string, any>
): Promise<void> => {
  try {
    await AuditLog.create({
      module: 'payroll',
      action,
      actor: {
        id: req.user?.id || 'unknown',
        role: req.user?.role,
        email: req.user?.email,
      },
      ...(target ? { target } : {}),
      ...(metadata ? { metadata } : {}),
    });
  } catch (error) {
    console.warn('audit log create failed', error);
  }
};


