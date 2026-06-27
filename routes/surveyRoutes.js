import express from 'express';
import { createSurveyResponse } from '../controllers/surveyController.js';

const router = express.Router();

router.post('/', createSurveyResponse);

export default router;
