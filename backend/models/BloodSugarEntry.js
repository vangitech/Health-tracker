// backend/models/BloodSugarEntry.js
import mongoose from 'mongoose';

const bloodSugarEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    
    type: String,
    required: true
  },
  glucoseValue: {
    type: Number,
    required: true,
    min: 0,
    max: 600
  },
  mealType: {
    type: String,
    enum: ['fbs', 'breakfast', 'lunch', 'dinner'],
    required: true
  },
  foodEaten: {
    type: String,
    trim: true
  },
  carbs: {
    type: Number,
    min: 0,
    default: 0
  },
  insulinUnits: {
    type: Number,
    min: 0,
    default: 0
  },
  notes: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('BloodSugarEntry', bloodSugarEntrySchema);