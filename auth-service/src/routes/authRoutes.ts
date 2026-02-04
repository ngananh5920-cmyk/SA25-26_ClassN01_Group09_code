import express from 'express';
import { login, getMe, createUser } from '../controllers/authController';
import { createAuditLog, getAuditLogs } from '../controllers/auditController';
import { auth, adminOnly } from '../middleware/auth';
import { serviceKeyOnly } from '../middleware/serviceKey';

const router = express.Router();

// Public routes (no auth required)
router.post('/login', login);

// Protected routes (auth required)
router.get('/me', auth, getMe);
router.post('/users', auth, adminOnly, createUser);
router.get('/audit-logs', auth, adminOnly, getAuditLogs);

// Service-to-service
router.post('/audit-logs', serviceKeyOnly, createAuditLog);

export default router;
