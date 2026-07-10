import fs from 'fs';
import path from 'path';
import Poster from '../models/Poster.js';
import SurveyResponse from '../models/SurveyResponse.js';

const MOCK_RESPONSES_FILE = path.join(process.cwd(), 'mock_db_responses.json');

// Predefined mock posters for mock database mode
const mockPosters = [
  { _id: '667d022b79a29bf33682efd1', title: 'Warm Pastel Sun', image: '/images/poster_1.png', category: 'Minimalist', style: 'Minimalist Vector', active: true },
  { _id: '667d022b79a29bf33682efd2', title: 'Calm Ocean Waves', image: '/images/poster_2.png', category: 'Minimalist', style: 'Minimalist Vector', active: true },
  { _id: '667d022b79a29bf33682efd3', title: 'Glowing Neon Alley', image: '/images/poster_3.png', category: 'Cyberpunk', style: 'Synthwave Digital Art', active: true },
  { _id: '667d022b79a29bf33682efd4', title: 'Neon Cyber Sportscar', image: '/images/poster_4.png', category: 'Cyberpunk', style: 'Synthwave Digital Art', active: true },
  { _id: '667d022b79a29bf33682efd5', title: 'Amalfi Coast, Italy', image: '/images/poster_5.png', category: 'Vintage Travel', style: 'Retro 1960s Illustration', active: true },
  { _id: '667d022b79a29bf33682efd6', title: 'Mars Space Expedition', image: '/images/poster_6.png', category: 'Vintage Travel', style: 'Mid-century Sci-Fi Illustration', active: true },
  { _id: '667d022b79a29bf33682efd7', title: 'Dream Big Motivation', image: '/images/poster_7.png', category: 'Typography', style: 'Modern Bold Typography', active: true },
  { _id: '667d022b79a29bf33682efd8', title: 'Stay Focused Quote', image: '/images/poster_8.png', category: 'Typography', style: 'Minimalist High-Contrast Typography', active: true },
  { _id: '667d022b79a29bf33682efd9', title: 'Misty Mountain Pine Forest', image: '/images/poster_9.png', category: 'Nature Landscape', style: 'Atmospheric Landscape Photo', active: true },
  { _id: '667d022b79a29bf33682efda', title: 'Golden Autumn Path', image: '/images/poster_10.png', category: 'Nature Landscape', style: 'Scenic Autumn Landscape Photo', active: true },
  { _id: '667d022b79a29bf33682efdb', title: 'Abstract Liquid Gold Splash', image: '/images/poster_11.png', category: 'Pop Art / Abstract', style: 'Vibrant Fluid Acrylic', active: true },
  { _id: '667d022b79a29bf33682efdc', title: 'Neon Pop Comic Portrait', image: '/images/poster_12.png', category: 'Pop Art / Abstract', style: '80s Comic Book Illustration', active: true }
];

// Helper to read mock responses file
const readMockResponses = () => {
  try {
    if (!fs.existsSync(MOCK_RESPONSES_FILE)) {
      return [];
    }
    const data = fs.readFileSync(MOCK_RESPONSES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading mock database file:', error);
    return [];
  }
};

// Helper to write mock responses file
const writeMockResponses = (responses) => {
  try {
    fs.writeFileSync(MOCK_RESPONSES_FILE, JSON.stringify(responses, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing to mock database file:', error);
  }
};

export const dbService = {
  // Fetch posters
  getPosters: async () => {
    if (global.isMockDB) {
      console.log('API running in Mock DB Mode - Returning local posters.');
      return mockPosters;
    }
    return await Poster.find({ active: true });
  },

  // Check if session ID already exists to prevent duplicate submissions
  findResponseBySessionId: async (sessionId) => {
    if (global.isMockDB) {
      const responses = readMockResponses();
      return responses.find(r => r.sessionId === sessionId) || null;
    }
    return await SurveyResponse.findOne({ sessionId });
  },

  // Check if duplicate submission exists by device ID
  findDuplicateResponse: async (deviceId) => {
    if (global.isMockDB) {
      const responses = readMockResponses();
      return responses.find(r => r.deviceId === deviceId) || null;
    }
    return await SurveyResponse.findOne({ deviceId });
  },

  // Save survey response
  saveSurveyResponse: async (responseData) => {
    if (global.isMockDB) {
      const responses = readMockResponses();
      const newResponse = {
        _id: 'mock_resp_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
        ...responseData,
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      responses.push(newResponse);
      writeMockResponses(responses);
      return newResponse;
    }

    const newResponse = new SurveyResponse({
      sessionId: responseData.sessionId,
      answers: responseData.answers,
      name: responseData.name,
      deviceId: responseData.deviceId,
      completedAt: new Date()
    });
    return await newResponse.save();
  },

  // Get all survey responses
  getResponses: async () => {
    if (global.isMockDB) {
      return readMockResponses();
    }
    return await SurveyResponse.find().sort({ createdAt: -1 });
  },

  // Save multiple responses (useful for seeding mock responses)
  saveMultipleResponses: async (responsesData) => {
    if (global.isMockDB) {
      const responses = readMockResponses();
      const formatted = responsesData.map(r => ({
        _id: 'mock_resp_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
        ...r,
        completedAt: r.completedAt || new Date().toISOString(),
        createdAt: r.createdAt || new Date().toISOString(),
        updatedAt: r.updatedAt || new Date().toISOString()
      }));
      const updatedResponses = [...responses, ...formatted];
      writeMockResponses(updatedResponses);
      return updatedResponses;
    }
    return await SurveyResponse.insertMany(responsesData);
  },

  // Clear all survey responses
  clearResponses: async () => {
    if (global.isMockDB) {
      writeMockResponses([]);
      return true;
    }
    await SurveyResponse.deleteMany({});
    return true;
  }
};
