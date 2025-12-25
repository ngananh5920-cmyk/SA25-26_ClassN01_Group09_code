import express from 'express';
import { register, login, getMe, linkEmployee } from '../controllers/authController';
import { auth } from '../middleware/auth';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, getMe);
router.put('/link-employee', auth, linkEmployee);

export default router;


