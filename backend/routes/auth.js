// backend/routes/auth.js
import express from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import User from '../models/User.js';
import VerificationCode from '../models/VerificationCode.js';
import { sendVerificationEmail } from '../utils/email.js';
import { authenticateToken } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { avatarStorage, extractPublicId, deleteImage, MAX_FILE_SIZE, ALLOWED_FORMATS } from '../utils/cloudinary.js';

const upload = multer({
  storage: avatarStorage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const ext = file.mimetype.split('/')[1];
    if (ALLOWED_FORMATS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpg, png, gif, webp) are allowed'), false);
    }
  },
});

function handleMulterError(err, req, res, next) {
  if (err) {
    console.error('Upload error:', err?.message || err);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ message: err.message || 'File upload failed. Check server configuration.' });
  }
  next();
}

const uploadAvatar = (fieldName) => (req, res, next) => {
  try {
    upload.single(fieldName)(req, res, (err) => {
      try {
        handleMulterError(err, req, res, next);
      } catch (handleError) {
        console.error('Error in upload callback:', handleError);
        res.status(500).json({ message: 'Upload processing failed' });
      }
    });
  } catch (uploadError) {
    console.error('Upload middleware error:', uploadError);
    res.status(500).json({ message: uploadError?.message || 'Upload initialization failed' });
  }
};

const router = express.Router();

// Generate random 6-digit code
const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Register user
router.post(
  '/register',
  authLimiter,
  [
    body('firstName').notEmpty().trim(),
    body('lastName').notEmpty().trim(),
    body('email').isEmail().normalizeEmail(),
    body('phone').notEmpty(),
    body('dob').isISO8601(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/\d/)
      .withMessage('Password must include at least one number')
      .matches(/[^a-zA-Z0-9]/)
      .withMessage('Password must include at least one special character'),
  ],
  async (req, res) => {
    console.log('📝 Registration data received:', {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone,
      dob: req.body.dob,
      password: req.body.password ? '***' : 'none',
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
        isVerified: false,
      });
      await user.save();

      // Generate and save verification code
      const code = generateCode();
      const verificationCode = new VerificationCode({
        email,
        code,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
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
        email,
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
  [body('email').isEmail().normalizeEmail(), body('code').isLength({ min: 6, max: 6 })],
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

      const token = jwt.sign(
        { id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.cookie('token', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      res.json({
        message: 'Email verified successfully',
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          avatar: user.avatar,
        },
      });
    } catch (error) {
      console.error('❌ Registration error:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
      });
      res.status(500).json({
        message: 'Server error',
        details: error.message,
      });
    }
  }
);

// Login
router.post(
  '/login',
  authLimiter,
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
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
        { id: user._id, email: user.email, firstName: user.firstName, lastName: user.lastName },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.cookie('token', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      res.json({
        token,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          avatar: user.avatar,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Resend verification code
router.post('/resend-code', authLimiter, [body('email').isEmail().normalizeEmail()], async (req, res) => {
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
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    await verificationCode.save();

    // Send verification email
    await sendVerificationEmail(email, code);

    res.json({ message: 'Verification code sent to email' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get current authenticated user's profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        dob: user.dob,
        avatar: user.avatar,
        isVerified: user.isVerified,
        provider: user.provider,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Failed to fetch profile', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Logout — clear httpOnly cookie
router.post('/logout', (req, res) => {
  res.clearCookie('token', { path: '/' });
  res.json({ message: 'Logged out' });
});

// Upload profile avatar
router.put('/profile', authenticateToken, uploadAvatar('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Delete old Cloudinary image if present
    const currentUser = await User.findById(req.user.id);
    if (currentUser?.avatar) {
      const oldPublicId = extractPublicId(currentUser.avatar);
      await deleteImage(oldPublicId);
    }

    const avatarUrl = req.file.path;
    const updatedUser = await User.findByIdAndUpdate(req.user.id, { avatar: avatarUrl }, { new: true }).select(
      '-password'
    );
    res.json({
      user: {
        id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        phone: updatedUser.phone,
        dob: updatedUser.dob,
        avatar: updatedUser.avatar,
        isVerified: updatedUser.isVerified,
        provider: updatedUser.provider,
        createdAt: updatedUser.createdAt,
      },
    });
  } catch (error) {
    console.error('Failed to upload avatar', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
