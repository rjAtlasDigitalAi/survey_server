import { dbService } from '../services/dbService.js';

// Retrieve all survey poster pairs
export const getPosterPairs = async (req, res) => {
  try {
    const posters = await dbService.getPosters();
    
    // Group posters by category to form pairs
    const categoryMap = {};
    posters.forEach(poster => {
      if (!categoryMap[poster.category]) {
        categoryMap[poster.category] = [];
      }
      categoryMap[poster.category].push(poster);
    });

    const categories = Object.keys(categoryMap);
    const pairs = [];
    let questionNumber = 1;

    // Try to pair them up by category
    for (const cat of categories) {
      const items = categoryMap[cat];
      if (items.length >= 2) {
        pairs.push({
          questionNumber,
          category: cat,
          leftPoster: items[0],
          rightPoster: items[1]
        });
        questionNumber++;
      }
      if (pairs.length === 6) break;
    }

    // Fallback if not grouped nicely by category (just pair sequentially)
    if (pairs.length < 6 && posters.length >= 12) {
      pairs.length = 0; // Clear
      for (let i = 0; i < 6; i++) {
        pairs.push({
          questionNumber: i + 1,
          category: posters[i * 2].category,
          leftPoster: posters[i * 2],
          rightPoster: posters[i * 2 + 1]
        });
      }
    }

    res.json(pairs);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving poster pairs', error: error.message });
  }
};
