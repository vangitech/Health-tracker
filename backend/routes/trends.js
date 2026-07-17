// backend/routes/trends.js
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import BloodSugarEntry from '../models/BloodSugarEntry.js';

const router = express.Router();

// Calculate estimated A1C from average glucose (mmol/L to A1C %)
const calculateA1C = (avgGlucoseMMOL) => {
  // Convert mmol/L to mg/dL
  const avgGlucoseMGDL = avgGlucoseMMOL * 18.018;
  // A1C formula: A1C% = (Average Glucose mg/dL + 46.7) / 28.7
  const a1c = (avgGlucoseMGDL + 46.7) / 28.7;
  return Math.round(a1c * 10) / 10;
};

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const entries = await BloodSugarEntry.find({
      userId: req.user.id,
      date: { $gte: startDate },
    }).sort({ date: 1 });

    if (entries.length === 0) {
      return res.json({
        averageGlucose: null,
        estimatedA1C: null,
        totalEntries: 0,
        inRangeCount: 0,
        borderlineCount: 0,
        highCount: 0,
        lowCount: 0,
        weeklyAverages: [],
      });
    }

    // Calculate statistics
    const glucoseValues = entries.map((e) => e.glucoseValue);
    const averageGlucose = glucoseValues.reduce((a, b) => a + b, 0) / glucoseValues.length;

    // Color range thresholds (mmol/L)
    // Green: 3.9-7.0, Yellow: >7.0-10.0, Red: <3.9 or >10.0
    const lowCount = glucoseValues.filter((g) => g < 3.9).length;
    const inRangeCount = glucoseValues.filter((g) => g >= 3.9 && g <= 7.0).length;
    const borderlineCount = glucoseValues.filter((g) => g > 7.0 && g <= 10.0).length;
    const highCount = glucoseValues.filter((g) => g > 10.0).length;

    // Calculate weekly averages
    const weeklyAverages = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i + 1) * 7);
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() - i * 7);

      const weekEntries = entries.filter((e) => {
        const entryDate = new Date(e.date);
        return entryDate >= weekStart && entryDate < weekEnd;
      });

      if (weekEntries.length > 0) {
        const weekAvg = weekEntries.reduce((a, b) => a + b.glucoseValue, 0) / weekEntries.length;
        weeklyAverages.push({
          week: i + 1,
          average: Math.round(weekAvg * 10) / 10,
          count: weekEntries.length,
        });
      }
    }

    res.json({
      averageGlucose: Math.round(averageGlucose * 10) / 10,
      estimatedA1C: calculateA1C(averageGlucose),
      totalEntries: entries.length,
      inRangeCount,
      borderlineCount,
      highCount,
      lowCount,
      weeklyAverages,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
