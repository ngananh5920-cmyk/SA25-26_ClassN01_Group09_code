import express from 'express';
import {
  checkIn,
  checkOut,
  getAttendances,
  getAttendance,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getStats,
  getTodayStatus,
} from '../controllers/attendanceController';
import { auth, adminOrHR, adminHRManager } from '../middleware/auth';

const router = express.Router();

router.use(auth);

// Public routes (cho tất cả nhân viên)
router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.get('/today', getTodayStatus);

// Routes cho tất cả roles
router.get('/', getAttendances);
router.get('/stats', getStats);
router.get('/:id', getAttendance);

// Routes chỉ cho Admin/HR
router.post('/create', adminOrHR, createAttendance);
router.put('/:id', updateAttendance);
router.delete('/:id', adminOrHR, deleteAttendance);

export default router;

