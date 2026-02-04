import express from 'express';
import { getAuditLogs } from '../controllers/auditLogController';
import { auth, adminOnly } from '../middleware/auth';

const router = express.Router();

router.use(auth);
router.get('/', adminOnly, getAuditLogs);
router.get('/leave', adminOnly, getAuditLogs);

export default router;

