import express from 'express';
import {
  getSalaries,
  getSalary,
  createSalary,
  updateSalary,
  deleteSalary,
  processPayroll,
} from '../controllers/salaryController';
import { auth, adminOnly } from '../middleware/auth';

const router = express.Router();

router.use(auth);

router.get('/', getSalaries);
router.get('/:id', getSalary);
router.post('/', adminOnly, createSalary);
router.post('/process-payroll', adminOnly, processPayroll);
router.put('/:id', adminOnly, updateSalary);
router.delete('/:id', adminOnly, deleteSalary);

export default router;


