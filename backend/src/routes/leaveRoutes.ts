import express from 'express';
import {
  getLeaves,
  getLeave,
  createLeave,
  updateLeave,
  approveLeave,
  deleteLeave,
} from '../controllers/leaveController';
import { auth, adminOnly, adminHRManager } from '../middleware/auth';

const router = express.Router();

router.use(auth);

router.get('/', getLeaves);
router.get('/:id', getLeave);
router.post('/', createLeave);
router.put('/:id', updateLeave);
router.put('/:id/approve', adminHRManager, approveLeave);
router.delete('/:id', deleteLeave);

export default router;

