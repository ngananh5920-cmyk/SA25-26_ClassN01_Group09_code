import express from 'express';
import { getAttendance, createAttendance } from '../controllers/attendanceController';
import { auth, adminOnly } from '../middleware/auth';

const router = express.Router();

router.use(auth);
router.get('/', getAttendance);
router.post('/', adminOnly, createAttendance);

export default router;

