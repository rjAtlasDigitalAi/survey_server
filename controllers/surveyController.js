import { dbService } from '../services/dbService.js';

// Save survey response
export const createSurveyResponse = async (req, res) => {
  try {
    const { sessionId, answers, upiId, deviceId } = req.body;

    // 1. Basic validation
    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required.' });
    }

    if (!answers || !Array.isArray(answers) || answers.length !== 6) {
      return res.status(400).json({ message: 'Exactly 6 survey answers are required.' });
    }

    if (!upiId) {
      return res.status(400).json({ message: 'UPI ID is required for cashback request.' });
    }

    if (!deviceId) {
      return res.status(400).json({ message: 'Device ID is required.' });
    }

    // 2. Validate UPI ID format
    // Format: username@bankname (e.g., example@okaxis, john.doe@ybl, etc.)
    const cleanUpi = upiId.trim().toLowerCase();
    const upiRegex = /^[\w.-]+@[\w.-]+$/;
    if (!upiRegex.test(cleanUpi)) {
      return res.status(400).json({ message: 'Invalid UPI ID format. Standard format is username@bank (e.g., user@okaxis).' });
    }

    // 3. Prevent duplicate submissions using sessionId
    const existingResponse = await dbService.findResponseBySessionId(sessionId);
    if (existingResponse) {
      return res.status(409).json({ message: 'A survey response has already been submitted for this session.' });
    }

    // 4. Prevent duplicate submissions using UPI or Device ID
    const existingSubmission = await dbService.findDuplicateResponse(cleanUpi, deviceId);
    if (existingSubmission) {
      return res.status(409).json({ message: 'You have already submitted this survey.' });
    }

    // 5. Validate answers content
    for (const ans of answers) {
      if (!ans.questionNumber || !ans.leftPosterId || !ans.rightPosterId || !ans.selectedPosterId) {
        return res.status(400).json({ 
          message: `Answer for question number ${ans.questionNumber || 'unknown'} is incomplete.` 
        });
      }
    }

    // 6. Save response using database service
    await dbService.saveSurveyResponse({
      sessionId,
      answers,
      upiId: cleanUpi,
      deviceId
    });

    // 7. Generate random reference number
    // Format: SURV-XXXXXX where XXXXXX is 6 random digits
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const referenceNumber = `SURV-${randomDigits}`;

    res.status(201).json({
      success: true,
      message: 'Survey response and cashback request recorded successfully.',
      referenceNumber
    });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting survey response', error: error.message });
  }
};
