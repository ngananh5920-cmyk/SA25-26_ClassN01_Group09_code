import express from 'express';
import {
  getSalaries,
  getSalary,
  createSalary,
  updateSalary,
  deleteSalary,
  processPayroll,
} from '../controllers/salaryController';
import { auth, adminOrHR } from '../middleware/auth';

const router = express.Router();

router.use(auth);

router.get('/', getSalaries);
router.get('/:id', getSalary);
router.post('/', adminOrHR, createSalary);
router.post('/process-payroll', adminOrHR, processPayroll);
router.put('/:id', adminOrHR, updateSalary);
router.delete('/:id', adminOrHR, deleteSalary);

export default router;






