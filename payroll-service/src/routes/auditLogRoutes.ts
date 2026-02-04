import express from 'express';
import { getAuditLogs } from '../controllers/auditLogController';
import { auth, adminOnly } from '../middleware/auth';

const router = express.Router();

router.use(auth);
router.get('/payroll', adminOnly, getAuditLogs);

export default router;


