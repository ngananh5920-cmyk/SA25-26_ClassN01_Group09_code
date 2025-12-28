import express from 'express';
import {
  getWorkShifts,
  getWorkShift,
  createWorkShift,
  updateWorkShift,
  deleteWorkShift,
} from '../controllers/workShiftController';
import { auth, adminOnly, adminOrHR } from '../middleware/auth';

const router = express.Router();

router.use(auth);

router.get('/', getWorkShifts);
router.get('/:id', getWorkShift);
router.post('/', adminOrHR, createWorkShift);
router.put('/:id', adminOrHR, updateWorkShift);
router.delete('/:id', adminOnly, deleteWorkShift);

export default router;

