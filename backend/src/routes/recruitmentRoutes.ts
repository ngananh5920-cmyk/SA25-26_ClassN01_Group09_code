import express from 'express';
import {
  getRecruitments,
  getRecruitment,
  createRecruitment,
  updateRecruitment,
  deleteRecruitment,
  getCandidates,
  createCandidate,
  updateCandidate,
  deleteCandidate,
} from '../controllers/recruitmentController';
import { auth, adminOnly, adminOrHR } from '../middleware/auth';

const router = express.Router();

router.use(auth);

// Recruitment routes
router.get('/', adminOrHR, getRecruitments);
router.get('/:id', adminOrHR, getRecruitment);
router.post('/', adminOrHR, createRecruitment);
router.put('/:id', adminOrHR, updateRecruitment);
router.delete('/:id', adminOnly, deleteRecruitment);

// Candidate routes
router.get('/:id/candidates', adminOrHR, getCandidates);
router.post('/:id/candidates', createCandidate); // Public for job applicants
router.put('/candidates/:id', adminOrHR, updateCandidate);
router.delete('/candidates/:id', adminOrHR, deleteCandidate);

export default router;

