import express from 'express';
import {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeStats,
  getEmployeeIdsByDepartment,
} from '../controllers/employeeController';
import { getEmployeesBatch } from '../controllers/employeeBatchController';
import { auth, adminOnly } from '../middleware/auth';
import { serviceKeyOnly } from '../middleware/serviceKey';

const router = express.Router();

router.get('/by-department', serviceKeyOnly, getEmployeeIdsByDepartment);
router.post('/batch', serviceKeyOnly, getEmployeesBatch);

router.use(auth);

router.get('/stats', adminOnly, getEmployeeStats);
router.get('/', getEmployees); // Manager and employee access is filtered in the controller
router.get('/:id', getEmployee);
router.post('/', adminOnly, createEmployee);
router.put('/:id', adminOnly, updateEmployee);
router.delete('/:id', adminOnly, deleteEmployee);

export default router;

