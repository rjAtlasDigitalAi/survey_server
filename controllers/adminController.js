import { dbService } from '../services/dbService.js';

// Helper to seed realistic mock responses if database is empty
const seedMockData = async (posters) => {
  const categoryMap = {};
  posters.forEach(poster => {
    if (!categoryMap[poster.category]) {
      categoryMap[poster.category] = [];
    }
    categoryMap[poster.category].push(poster);
  });

  const categories = Object.keys(categoryMap);
  const pairs = [];
  let qNum = 1;

  for (const cat of categories) {
    const items = categoryMap[cat];
    if (items.length >= 2) {
      pairs.push({
        questionNumber: qNum,
        leftPosterId: items[0]._id,
        rightPosterId: items[1]._id,
        // Establish a slight popularity bias for left posters in some categories
        leftBias: Math.random() > 0.4
      });
      qNum++;
    }
    if (pairs.length === 4) break;
  }

  // Fallback sequential pairs if not grouped nicely by category
  if (pairs.length < 4 && posters.length >= 8) {
    pairs.length = 0;
    for (let i = 0; i < 4; i++) {
      pairs.push({
        questionNumber: i + 1,
        leftPosterId: posters[i * 2]._id,
        rightPosterId: posters[i * 2 + 1]._id,
        leftBias: Math.random() > 0.4
      });
    }
  }

  const mockNames = [
    'arjun', 'priya', 'amit', 'neha', 'rohit', 'sneha', 
    'rahul', 'pooja', 'vikram', 'ananya', 'sanjay', 'divya', 
    'aditya', 'riya', 'abhishek', 'tanvi', 'manoj', 'shruti'
  ];

  const mockResponses = [];
  const now = new Date();

  // Generate 24 mock submissions spread over the last 6 days
  for (let i = 0; i < 24; i++) {
    const rawName = mockNames[i % mockNames.length];
    const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);
    const sessionId = `sess_mock_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}`;
    
    // Spread completion dates over the last 6 days
    const dateOffsetDays = i % 6; // 0 to 5 days ago
    const hourOffset = Math.floor(Math.random() * 24);
    const minuteOffset = Math.floor(Math.random() * 60);
    const completedAt = new Date(now.getTime() - (dateOffsetDays * 24 * 60 * 60 * 1000) - (hourOffset * 60 * 60 * 1000) - (minuteOffset * 60 * 1000));

    const answers = pairs.map(p => {
      // 75% chance to pick biased side, 25% to pick other side
      const selectLeft = Math.random() < (p.leftBias ? 0.75 : 0.25);
      const selectedPosterId = selectLeft ? p.leftPosterId : p.rightPosterId;
      return {
        questionNumber: p.questionNumber,
        leftPosterId: p.leftPosterId,
        rightPosterId: p.rightPosterId,
        selectedPosterId
      };
    });

    const deviceId = `dev_mock_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`;

    mockResponses.push({
      sessionId,
      answers,
      name,
      deviceId,
      completedAt,
      createdAt: completedAt,
      updatedAt: completedAt
    });
  }

  // Insert mock data into database
  await dbService.saveMultipleResponses(mockResponses);
  console.log(`Seeded ${mockResponses.length} mock survey responses.`);
};

// Retrieve dashboard analytics
export const getAnalytics = async (req, res) => {
  try {
    const posters = await dbService.getPosters();
    let responses = await dbService.getResponses();

    // Auto-seed mock responses if there are none and there are posters
    if (responses.length === 0 && posters.length > 0) {
      await seedMockData(posters);
      responses = await dbService.getResponses();
    }

    const totalResponses = responses.length;

    // 1. Calculate Unique name accounts
    const uniqueNames = new Set(responses.map(r => (r.name || '').toLowerCase().trim()));
    const uniqueNameCount = uniqueNames.size;

    // Create a lookup map for posters to simplify population
    const posterMap = {};
    posters.forEach(p => {
      posterMap[p._id.toString()] = p;
    });

    // 2. Initialize poster stats
    const posterStats = {};
    posters.forEach(p => {
      posterStats[p._id.toString()] = {
        _id: p._id,
        title: p.title,
        image: p.image,
        category: p.category,
        style: p.style,
        active: p.active,
        views: 0,
        selections: 0,
        winRate: 0
      };
    });

    // 3. Process responses to compute poster views & selections
    responses.forEach(resp => {
      resp.answers.forEach(ans => {
        const leftIdStr = ans.leftPosterId.toString();
        const rightIdStr = ans.rightPosterId.toString();
        const selIdStr = ans.selectedPosterId.toString();

        // Increment views
        if (posterStats[leftIdStr]) posterStats[leftIdStr].views++;
        if (posterStats[rightIdStr]) posterStats[rightIdStr].views++;
        
        // Increment selections
        if (posterStats[selIdStr]) posterStats[selIdStr].selections++;
      });
    });

    // Compute win rate for each poster
    const posterStatsList = Object.values(posterStats).map(p => {
      const winRate = p.views > 0 ? (p.selections / p.views) * 100 : 0;
      return {
        ...p,
        winRate: parseFloat(winRate.toFixed(1))
      };
    });

    // 4. Compute Category Stats
    const categoryStatsMap = {};
    posterStatsList.forEach(p => {
      if (!categoryStatsMap[p.category]) {
        categoryStatsMap[p.category] = {
          category: p.category,
          totalViews: 0,
          totalSelections: 0,
          postersCount: 0
        };
      }
      categoryStatsMap[p.category].totalViews += p.views;
      categoryStatsMap[p.category].totalSelections += p.selections;
      categoryStatsMap[p.category].postersCount++;
    });

    const categoryStats = Object.values(categoryStatsMap).map(c => {
      const winRate = c.totalViews > 0 ? (c.totalSelections / c.totalViews) * 100 : 0;
      return {
        ...c,
        winRate: parseFloat(winRate.toFixed(1))
      };
    });

    // 5. Compute Timeline stats (responses per day)
    const timelineMap = {};
    responses.forEach(r => {
      const dateStr = new Date(r.completedAt).toISOString().split('T')[0];
      timelineMap[dateStr] = (timelineMap[dateStr] || 0) + 1;
    });

    // Format timeline for easier consumption in frontend charts
    const timelineStats = Object.keys(timelineMap)
      .sort()
      .map(date => ({
        date,
        count: timelineMap[date]
      }));

    // 6. Format response list, attaching full poster information to each answer
    const formattedResponsesList = responses.map(r => {
      const answersWithDetails = r.answers.map(ans => {
        const leftIdStr = ans.leftPosterId.toString();
        const rightIdStr = ans.rightPosterId.toString();
        const selIdStr = ans.selectedPosterId.toString();

        return {
          questionNumber: ans.questionNumber,
          leftPoster: posterMap[leftIdStr] || { _id: ans.leftPosterId, title: 'Unknown Poster', image: '' },
          rightPoster: posterMap[rightIdStr] || { _id: ans.rightPosterId, title: 'Unknown Poster', image: '' },
          selectedPoster: posterMap[selIdStr] || { _id: ans.selectedPosterId, title: 'Unknown Poster', image: '' }
        };
      });

      return {
        _id: r._id,
        sessionId: r.sessionId,
        name: r.name,
        completedAt: r.completedAt,
        createdAt: r.createdAt,
        answers: answersWithDetails
      };
    });

    res.json({
      summary: {
        totalResponses,
        uniqueNameCount,
        totalPosters: posters.length
      },
      posters: posterStatsList.sort((a, b) => b.winRate - a.winRate),
      categories: categoryStats.sort((a, b) => b.winRate - a.winRate),
      timeline: timelineStats,
      responses: formattedResponsesList
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving analytics data', error: error.message });
  }
};

// Reset responses database
export const clearResponses = async (req, res) => {
  try {
    await dbService.clearResponses();
    res.json({
      success: true,
      message: 'All survey responses have been cleared.'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error clearing responses database', error: error.message });
  }
};
