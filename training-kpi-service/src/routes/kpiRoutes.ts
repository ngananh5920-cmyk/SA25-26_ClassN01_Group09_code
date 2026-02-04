import express from 'express';
import {
  getKPIs,
  getKPI,
  createKPI,
  updateKPI,
  reviewKPI,
  deleteKPI,
} from '../controllers/kpiController';
import { auth, adminOnly, adminHRManager } from '../middleware/auth';

const router = express.Router();

router.use(auth);

router.get('/', getKPIs);
router.get('/:id', getKPI);
router.post('/', adminHRManager, createKPI);
router.put('/:id', updateKPI);
router.put('/:id/review', adminHRManager, reviewKPI);
router.delete('/:id', adminOnly, deleteKPI);

export default router;


