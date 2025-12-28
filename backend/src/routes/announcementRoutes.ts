import express from 'express';
import {
  getAnnouncements,
  getAllAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../controllers/announcementController';
import { auth, adminOnly, adminOrHR } from '../middleware/auth';

const router = express.Router();

router.use(auth);

router.get('/', getAnnouncements); // Public announcements
router.get('/all', adminOrHR, getAllAnnouncements); // All including drafts
router.get('/:id', getAnnouncement);
router.post('/', adminOrHR, createAnnouncement);
router.put('/:id', adminOrHR, updateAnnouncement);
router.delete('/:id', adminOnly, deleteAnnouncement);

export default router;


