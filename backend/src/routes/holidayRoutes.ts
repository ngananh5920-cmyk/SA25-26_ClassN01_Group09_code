import express from 'express';
import {
  getHolidays,
  getHoliday,
  createHoliday,
  updateHoliday,
  deleteHoliday,
} from '../controllers/holidayController';
import { auth, adminOnly, adminOrHR } from '../middleware/auth';

const router = express.Router();

router.use(auth);

router.get('/', getHolidays);
router.get('/:id', getHoliday);
router.post('/', adminOrHR, createHoliday);
router.put('/:id', adminOrHR, updateHoliday);
router.delete('/:id', adminOnly, deleteHoliday);

export default router;

