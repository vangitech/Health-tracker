import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    unique: true,
  },
  phone: {
    type: String,
  },
  dob: {
    type: Date,
  },
  password: {
    type: String,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  provider: {
    type: String,
    enum: ['local', 'google', 'yahoo', 'apple', 'github', 'microsoft'],
    default: 'local',
  },
  providerId: {
    type: String,
  },
  avatar: {
    type: String,
  },
  role: {
    type: String,
    enum: ['patient', 'admin', 'superadmin', 'doctor', 'recordofficer', 'nurse'],
    default: 'patient',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return;
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw new Error('Password hashing failed: ' + error.message);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
