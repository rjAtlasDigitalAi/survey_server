import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import Poster from '../models/Poster.js';
import SurveyResponse from '../models/SurveyResponse.js';

// Load environment variables
dotenv.config();

const posters = [
  // Category 1: Minimalist
  {
    title: 'Warm Pastel Sun',
    image: '/images/poster_1.png',
    category: 'Minimalist',
    style: 'Minimalist Vector',
    active: true
  },
  {
    title: 'Calm Ocean Waves',
    image: '/images/poster_2.png',
    category: 'Minimalist',
    style: 'Minimalist Vector',
    active: true
  },
  // Category 2: Cyberpunk
  {
    title: 'Glowing Neon Alley',
    image: '/images/poster_3.png',
    category: 'Cyberpunk',
    style: 'Synthwave Digital Art',
    active: true
  },
  {
    title: 'Neon Cyber Sportscar',
    image: '/images/poster_4.png',
    category: 'Cyberpunk',
    style: 'Synthwave Digital Art',
    active: true
  },
  // Category 3: Vintage Travel
  {
    title: 'Amalfi Coast, Italy',
    image: '/images/poster_5.png',
    category: 'Vintage Travel',
    style: 'Retro 1960s Illustration',
    active: true
  },
  {
    title: 'Mars Space Expedition',
    image: '/images/poster_6.png',
    category: 'Vintage Travel',
    style: 'Mid-century Sci-Fi Illustration',
    active: true
  },
  // Category 4: Typography
  {
    title: 'Dream Big Motivation',
    image: '/images/poster_7.png',
    category: 'Typography',
    style: 'Modern Bold Typography',
    active: true
  },
  {
    title: 'Stay Focused Quote',
    image: '/images/poster_8.png',
    category: 'Typography',
    style: 'Minimalist High-Contrast Typography',
    active: true
  },
  // Category 5: Nature Landscape
  {
    title: 'Misty Mountain Pine Forest',
    image: '/images/poster_9.png',
    category: 'Nature Landscape',
    style: 'Atmospheric Landscape Photo',
    active: true
  },
  {
    title: 'Golden Autumn Path',
    image: '/images/poster_10.png',
    category: 'Nature Landscape',
    style: 'Scenic Autumn Landscape Photo',
    active: true
  },
  // Category 6: Pop Art / Abstract
  {
    title: 'Abstract Liquid Gold Splash',
    image: '/images/poster_11.png',
    category: 'Pop Art / Abstract',
    style: 'Vibrant Fluid Acrylic',
    active: true
  },
  {
    title: 'Neon Pop Comic Portrait',
    image: '/images/poster_12.png',
    category: 'Pop Art / Abstract',
    style: '80s Comic Book Illustration',
    active: true
  }
];

const seedData = async () => {
  try {
    // Connect to database
    await connectDB();

    // Clear existing posters and survey responses
    await Poster.deleteMany();
    await SurveyResponse.deleteMany();
    console.log('Database cleared of existing Posters and Survey Responses.');

    // Seed new posters
    const seededPosters = await Poster.insertMany(posters);
    console.log(`${seededPosters.length} Posters seeded successfully!`);

    console.log('\nSeed Details:');
    seededPosters.forEach(p => {
      console.log(`- [${p.category}] ${p.title} (${p._id})`);
    });

    process.exit(0);
  } catch (error) {
    console.error(`Seeding error: ${error.message}`);
    process.exit(1);
  }
};

seedData();
