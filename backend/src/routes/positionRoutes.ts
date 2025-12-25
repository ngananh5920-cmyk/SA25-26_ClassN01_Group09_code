import express from 'express';
import {
  getPositions,
  getPosition,
  createPosition,
  updatePosition,
  deletePosition,
} from '../controllers/positionController';
import { auth, adminOnly } from '../middleware/auth';

const router = express.Router();

router.use(auth);

router.get('/', getPositions);
router.get('/:id', getPosition);
router.post('/', adminOnly, createPosition);
router.put('/:id', adminOnly, updatePosition);
router.delete('/:id', adminOnly, deletePosition);

export default router;


