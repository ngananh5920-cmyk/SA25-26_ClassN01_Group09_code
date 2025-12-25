import express from 'express';
import {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '../controllers/departmentController';
import { auth, adminOnly } from '../middleware/auth';

const router = express.Router();

router.use(auth);

router.get('/', getDepartments);
router.get('/:id', getDepartment);
router.post('/', adminOnly, createDepartment);
router.put('/:id', adminOnly, updateDepartment);
router.delete('/:id', adminOnly, deleteDepartment);

export default router;


