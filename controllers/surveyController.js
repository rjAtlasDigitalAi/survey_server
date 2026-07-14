import { dbService } from '../services/dbService.js';

// Save survey response
export const createSurveyResponse = async (req, res) => {
  try {
    const { sessionId, answers, name, deviceId } = req.body;

    // 1. Basic validation
    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required.' });
    }

    if (!answers || !Array.isArray(answers) || answers.length !== 4) {
      return res.status(400).json({ message: 'Exactly 4 selections are required.' });
    }

    if (!name) {
      return res.status(400).json({ message: 'Name is required.' });
    }

    if (!deviceId) {
      return res.status(400).json({ message: 'Device ID is required.' });
    }

    // 2. Validate Name
    const cleanName = name.trim();
    if (cleanName.length < 2) {
      return res.status(400).json({ message: 'Please enter a valid name (at least 2 characters).' });
    }

    // 3. Prevent duplicate submissions using sessionId
    const existingResponse = await dbService.findResponseBySessionId(sessionId);
    if (existingResponse) {
      return res.status(409).json({ message: 'Selections have already been recorded for this session.' });
    }

    // 4. Prevent duplicate submissions using Device ID
    const existingSubmission = await dbService.findDuplicateResponse(deviceId);
    if (existingSubmission) {
      return res.status(409).json({ message: 'You have already participated in this design preference activity.' });
    }

    // 5. Validate answers content
    for (const ans of answers) {
      if (!ans.questionNumber || !ans.leftPosterId || !ans.rightPosterId || !ans.selectedPosterId) {
        return res.status(400).json({ 
          message: `Selection for design pair ${ans.questionNumber || 'unknown'} is incomplete.` 
        });
      }
    }

    // 6. Save response using database service
    await dbService.saveSurveyResponse({
      sessionId,
      answers,
      name: cleanName,
      deviceId
    });

    // 7. Generate random reference number
    // Format: PREF-XXXXXX where XXXXXX is 6 random digits
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const referenceNumber = `PREF-${randomDigits}`;

    res.status(201).json({
      success: true,
      message: 'Your preferences and request have been recorded successfully.',
      referenceNumber
    });
  } catch (error) {
    res.status(500).json({ message: 'Error saving your preferences', error: error.message });
  }
};
