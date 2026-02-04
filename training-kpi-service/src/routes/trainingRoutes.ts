import express from 'express';
import {
  getTrainings,
  getTraining,
  createTraining,
  updateTraining,
  deleteTraining,
  enrollTraining,
  updateEnrollment,
  getMyTrainings,
} from '../controllers/trainingController';
import { auth, adminOnly, adminOrHR } from '../middleware/auth';

const router = express.Router();

router.use(auth);

// Training routes
router.get('/', getTrainings);
router.get('/my', getMyTrainings);
router.get('/:id', getTraining);
router.post('/', adminOrHR, createTraining);
router.put('/:id', adminOrHR, updateTraining);
router.delete('/:id', adminOnly, deleteTraining);

// Enrollment routes
router.post('/:trainingId/enroll', enrollTraining);
router.put('/enrollments/:id', adminOrHR, updateEnrollment);

export default router;


