import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController';
import { auth } from '../middleware/auth';

const router = express.Router();

router.use(auth);

router.get('/stats', getDashboardStats);

export default router;


