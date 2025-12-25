import express from 'express';
import {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeStats,
} from '../controllers/employeeController';
import { auth, adminOnly } from '../middleware/auth';

const router = express.Router();

router.use(auth);

router.get('/stats', adminOnly, getEmployeeStats);
router.get('/', getEmployees); // Manager và Employee có thể xem (đã filter trong controller)
router.get('/:id', getEmployee);
router.post('/', adminOnly, createEmployee);
router.put('/:id', adminOnly, updateEmployee);
router.delete('/:id', adminOnly, deleteEmployee);

export default router;

