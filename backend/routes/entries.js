// server/routes/entries.js
import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import BloodSugarEntry from '../models/BloodSugarEntry.js';

const router = express.Router();

// Get all entries for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const entries = await BloodSugarEntry.find({ userId: req.user.id })
      .sort({ date: -1, time: -1 });
    res.json(entries);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new entry
router.post(
  '/',
  authenticateToken,
  [
    body('date').isISO8601(),
    body('time').notEmpty(),
    body('glucoseValue').isFloat({ min: 0, max: 600 }),
    body('mealType').isIn(['fbs', 'breakfast', 'lunch', 'dinner']),
    body('foodEaten').optional().trim(),
    body('carbs').optional().isInt({ min: 0 }),
    body('insulinUnits').optional().isInt({ min: 0 }),
    body('notes').optional().trim()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const entry = new BloodSugarEntry({
        userId: req.user.id,
        ...req.body
      });
      await entry.save();
      res.status(201).json(entry);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Update entry
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const entry = await BloodSugarEntry.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    });
    
    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    Object.assign(entry, req.body);
    await entry.save();
    res.json(entry);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete entry
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const entry = await BloodSugarEntry.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user.id 
    });
    
    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }
    
    res.json({ message: 'Entry deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;