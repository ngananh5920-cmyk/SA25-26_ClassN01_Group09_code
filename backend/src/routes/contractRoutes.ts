import express from 'express';
import {
  getContracts,
  getContract,
  createContract,
  updateContract,
  deleteContract,
} from '../controllers/contractController';
import { auth, adminOnly, adminOrHR } from '../middleware/auth';

const router = express.Router();

router.use(auth);

router.get('/', adminOrHR, getContracts);
router.get('/:id', adminOrHR, getContract);
router.post('/', adminOnly, createContract);
router.put('/:id', adminOnly, updateContract);
router.delete('/:id', adminOnly, deleteContract);

export default router;


