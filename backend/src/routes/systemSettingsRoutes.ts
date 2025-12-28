import express from 'express';
import {
  getSettings,
  getSetting,
  setSetting,
  deleteSetting,
} from '../controllers/systemSettingsController';
import { auth, adminOnly } from '../middleware/auth';

const router = express.Router();

router.use(auth);

router.get('/', getSettings);
router.get('/:key', getSetting);
router.post('/', adminOnly, setSetting);
router.put('/:key', adminOnly, setSetting);
router.delete('/:key', adminOnly, deleteSetting);

export default router;


