import express from 'express';
import { getAuditLogs } from '../controllers/auditLogController';
import { auth, adminOnly } from '../middleware/auth';

const router = express.Router();

router.use(auth);
router.get('/training', adminOnly, getAuditLogs);
router.get('/kpi', adminOnly, getAuditLogs);

export default router;


