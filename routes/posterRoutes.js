import express from 'express';
import { getPosterPairs } from '../controllers/posterController.js';

const router = express.Router();

router.get('/', getPosterPairs);

export default router;
