import express from 'express';
import { getAnalytics, clearResponses } from '../controllers/adminController.js';

const router = express.Router();

router.get('/analytics', getAnalytics);
router.post('/clear', clearResponses);

export default router;
