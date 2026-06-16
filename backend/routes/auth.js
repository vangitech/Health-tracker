// backend/routes/auth.js
import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import VerificationCode from '../models/VerificationCode.js';
import { sendVerificationEmail } from '../utils/email.js';
import { authenticateToken } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads', 'avatars'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${req.user.id}-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype.split('/')[1]);
    cb(extOk && mimeOk ? null : new Error('Only image files (jpg, png, gif, webp) are allowed'), false);
  }
});

const router = express.Router();

// Generate random 6-digit code
const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Register user
router.post(
  '/register',
  [
    body('firstName').notEmpty().trim(),
    body('lastName').notEmpty().trim(),
    body('email').isEmail().normalizeEmail(),
    body('phone').notEmpty(),
    body('dob').isISO8601(),
    body('password').isLength({ min: 6 })
  ],
  async (req, res) => {
    console.log('📝 Registration data received:', { 
      firstName: req.body.firstName, 
      lastName: req.body.lastName, 
      email: req.body.email,
      phone: req.body.phone,
      dob: req.body.dob,
      password: req.body.password ? '***' : 'none'
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('❌ Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, phone, dob, password } = req.body;

    try {
      // Check if user exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Create user (unverified)
      const user = new User({
        firstName,
        lastName,
        email,
        phone,
        dob,
        password,
        isVerified: false
      });
      await user.save();

      // Generate and save verification code
      const code = generateCode();
      const verificationCode = new VerificationCode({
        email,
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      });
      await verificationCode.save();

      // Send verification email (optional - continue even if fails)
      try {
        await sendVerificationEmail(email, code);
        console.log('✅ Verification email sent to', email);
      } catch (emailError) {
        console.warn('⚠️ Email sending failed, but registration continues:', emailError.message);
        // Continue with registration even if email fails
      }

      res.status(201).json({
        message: 'User created. Verification code sent to email.',
        email 
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Verify email
router.post(
  '/verify',
  [
    body('email').isEmail().normalizeEmail(),
    body('code').isLength({ min: 6, max: 6 })
  ],
  async (req, res) => {
    const { email, code } = req.body;

    try {
      const verificationCode = await VerificationCode.findOne({ email, code });
      
      if (!verificationCode) {
        return res.status(400).json({ message: 'Invalid verification code' });
      }

      if (verificationCode.expiresAt < new Date()) {
        await VerificationCode.deleteOne({ _id: verificationCode._id });
        return res.status(400).json({ message: 'Code expired. Please register again.' });
      }

      // Update user as verified
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      user.isVerified = true;
      await user.save();

      // Delete used verification code
      await VerificationCode.deleteOne({ _id: verificationCode._id });

      res.json({ message: 'Email verified successfully' });
    } catch (error) {
      console.error('❌ Registration error:', {
        message: error.message,
        stack: error.stack,
        code: error.code
      });
      res.status(500).json({ 
        message: 'Server error',
        details: error.message 
      });
    }
  }
);

// Login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  async (req, res) => {
    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email });
      
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      if (!user.isVerified) {
        return res.status(401).json({ message: 'Please verify your email first' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Resend verification code
router.post(
  '/resend-code',
  [
    body('email').isEmail().normalizeEmail()
  ],
  async (req, res) => {
    const { email } = req.body;

    try {
      const user = await User.findOne({ email });
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (user.isVerified) {
        return res.status(400).json({ message: 'Email already verified' });
      }

      // Delete old verification code if exists
      await VerificationCode.deleteOne({ email });

      // Generate new code
      const code = generateCode();
      const verificationCode = new VerificationCode({
        email,
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      });
      await verificationCode.save();

      // Send verification email
      await sendVerificationEmail(email, code);

      res.json({ message: 'Verification code sent to email' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);


// Get current authenticated user's profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (error) {
    console.error('Failed to fetch profile', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload profile avatar
router.put('/profile', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: avatarUrl },
      { new: true }
    ).select('-password');
    res.json({ user });
  } catch (error) {
    console.error('Failed to upload avatar', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;