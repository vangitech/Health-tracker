import express from 'express';
import Appointment from '../models/Appointment.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const appointments = await Appointment.find({ userId: req.user.id })
      .populate('createdBy', 'firstName lastName role')
      .sort({ appointmentDate: -1 })
      .lean();

    res.json(appointments);
  } catch (err) {
    console.error('User appointments error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
