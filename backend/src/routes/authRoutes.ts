import express from 'express';
import { login, getMe } from '../controllers/authController';
import { auth } from '../middleware/auth';

const router = express.Router();

// Public routes (no auth required)
router.post('/login', login);

// Protected routes (auth required)
router.get('/me', auth, getMe);

export default router;
