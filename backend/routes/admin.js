import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import User from '../models/User.js'
import BloodSugarEntry from '../models/BloodSugarEntry.js'
import Appointment from '../models/Appointment.js'
import ChatMessage from '../models/ChatMessage.js'
import { authenticateAdmin, requireSuperAdmin } from '../middleware/adminAuth.js'
import { cloudinary, avatarStorage, extractPublicId, deleteImage, ALLOWED_FORMATS, MAX_FILE_SIZE } from '../utils/cloudinary.js'

const router = express.Router()

// Match users with patient role (handles legacy users missing the field)
function patientFilter(extra) {
  return { $or: [{ role: 'patient' }, { role: { $exists: false } }], ...extra }
}

// ── Auth ──────────────────────────────────────────────────────────

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' })
    }

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Admin access required' })
    }
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account deactivated' })
    }

    const valid = await user.comparePassword(password)
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    user.lastLogin = new Date()
    await user.save()

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, avatar: user.avatar },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
        lastLogin: user.lastLogin,
      },
    })
  } catch (err) {
    console.error('Admin login error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.post('/register', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'firstName, lastName, email, password required' })
    }

    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' })
    }

    const admin = new User({ firstName, lastName, email, phone, password, role: 'admin', isVerified: true })
    await admin.save()

    res.status(201).json({ message: 'Admin created', id: admin._id })
  } catch (err) {
    console.error('Admin register error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.post('/users', authenticateAdmin, async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, role = 'patient' } = req.body
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'firstName, lastName, email, password required' })
    }
    if (!['patient', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Role must be patient or admin' })
    }
    // Only superadmin can create admins
    if (role === 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Only super admin can create admins' })
    }

    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' })
    }

    const user = new User({ firstName, lastName, email, phone, password, role, isVerified: role !== 'patient' })
    await user.save()

    res.status(201).json({ message: 'User created', id: user._id, role: user.role })
  } catch (err) {
    console.error('Create user error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

// ── Analytics ─────────────────────────────────────────────────────

router.get('/analytics', authenticateAdmin, async (req, res) => {
  try {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const totalPatients = await User.countDocuments(patientFilter())
    const totalAdmins = await User.countDocuments({ role: { $in: ['admin', 'superadmin'] } })
    const totalEntries = await BloodSugarEntry.countDocuments({ date: { $gte: thirtyDaysAgo } })
    const newPatients30d = await User.countDocuments(patientFilter({ createdAt: { $gte: thirtyDaysAgo } }))
    const upcomingAppointments = await Appointment.countDocuments({ appointmentDate: { $gte: now }, status: 'scheduled' })

    const todayEntries = await BloodSugarEntry.countDocuments({ date: { $gte: todayStart } })
    const activeToday = await BloodSugarEntry.distinct('userId', { date: { $gte: todayStart } })

    const allPatients = await User.find(patientFilter()).select('_id').lean()
    const patientIds = allPatients.map((p) => p._id)

    const latestEntries = await BloodSugarEntry.aggregate([
      { $match: { userId: { $in: patientIds } } },
      { $sort: { date: -1, time: -1 } },
      { $group: { _id: '$userId', glucoseValue: { $first: '$glucoseValue' }, date: { $first: '$date' } } },
    ])

    let inRange = 0
    let outOfRange = 0
    for (const entry of latestEntries) {
      if (entry.glucoseValue >= 4.0 && entry.glucoseValue <= 7.0) inRange++
      else outOfRange++
    }

    // Weekly registrations for chart
    const weeklyRegistrations = []
    for (let i = 4; i >= 0; i--) {
      const weekStart = new Date(now)
      weekStart.setDate(weekStart.getDate() - (i + 1) * 7)
      const weekEnd = new Date(now)
      weekEnd.setDate(weekEnd.getDate() - i * 7)
      const count = await User.countDocuments(patientFilter({ createdAt: { $gte: weekStart, $lt: weekEnd } }))
      weeklyRegistrations.push({ week: `Week ${5 - i}`, count })
    }

    res.json({
      totalPatients,
      totalAdmins,
      totalEntries,
      newPatients30d,
      activeToday: activeToday.length,
      upcomingAppointments,
      inRangePatients: inRange,
      outOfRangePatients: outOfRange,
      weeklyRegistrations,
    })
  } catch (err) {
    console.error('Analytics error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

// ── Patients ──────────────────────────────────────────────────────

router.get('/patients', authenticateAdmin, async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query
    const query = patientFilter()
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ]
    }

    const skip = (parseInt(page) - 1) * parseInt(limit)
    const [patients, total] = await Promise.all([
      User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      User.countDocuments(query),
    ])

    // Attach latest reading and last appointment for each patient
    const result = await Promise.all(
      patients.map(async (patient) => {
        const [latestEntry, lastAppointment, nextAppointment] = await Promise.all([
          BloodSugarEntry.findOne({ userId: patient._id }).sort({ date: -1, time: -1 }).lean(),
          Appointment.findOne({ userId: patient._id, status: { $ne: 'cancelled' } }).sort({ appointmentDate: -1 }).lean(),
          Appointment.findOne({ userId: patient._id, appointmentDate: { $gte: new Date() }, status: 'scheduled' })
            .sort({ appointmentDate: 1 })
            .lean(),
        ])
        return {
          ...patient,
          latestReading: latestEntry?.glucoseValue ?? null,
          latestReadingDate: latestEntry?.date ?? null,
          lastAppointment: lastAppointment?.appointmentDate ?? null,
          nextAppointment: nextAppointment?.appointmentDate ?? null,
        }
      })
    )

    res.json({ patients: result, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) })
  } catch (err) {
    console.error('Patients list error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.get('/patients/range/out-of-range', authenticateAdmin, async (req, res) => {
  try {
    const allPatients = await User.find(patientFilter()).select('_id firstName lastName email phone avatar').lean()
    const patientIds = allPatients.map((p) => p._id)

    const latestEntries = await BloodSugarEntry.aggregate([
      { $match: { userId: { $in: patientIds } } },
      { $sort: { date: -1, time: -1 } },
      { $group: { _id: '$userId', glucoseValue: { $first: '$glucoseValue' }, date: { $first: '$date' }, time: { $first: '$time' } } },
    ])

    const entryMap = {}
    for (const e of latestEntries) {
      entryMap[e._id.toString()] = e
    }

    const outOfRange = []
    for (const patient of allPatients) {
      const entry = entryMap[patient._id.toString()]
      if (!entry) continue
      if (entry.glucoseValue < 4.0 || entry.glucoseValue > 7.0) {
        outOfRange.push({
          ...patient,
          latestReading: entry.glucoseValue,
          latestReadingDate: entry.date,
          latestReadingTime: entry.time,
        })
      }
    }

    res.json(outOfRange)
  } catch (err) {
    console.error('Out-of-range error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.get('/patients/range/in-range', authenticateAdmin, async (req, res) => {
  try {
    const allPatients = await User.find(patientFilter()).select('_id firstName lastName email phone avatar').lean()
    const patientIds = allPatients.map((p) => p._id)

    const latestEntries = await BloodSugarEntry.aggregate([
      { $match: { userId: { $in: patientIds } } },
      { $sort: { date: -1, time: -1 } },
      { $group: { _id: '$userId', glucoseValue: { $first: '$glucoseValue' }, date: { $first: '$date' }, time: { $first: '$time' } } },
    ])

    const entryMap = {}
    for (const e of latestEntries) {
      entryMap[e._id.toString()] = e
    }

    const inRange = []
    for (const patient of allPatients) {
      const entry = entryMap[patient._id.toString()]
      if (!entry) continue
      if (entry.glucoseValue >= 4.0 && entry.glucoseValue <= 7.0) {
        inRange.push({
          ...patient,
          latestReading: entry.glucoseValue,
          latestReadingDate: entry.date,
          latestReadingTime: entry.time,
        })
      }
    }

    res.json(inRange)
  } catch (err) {
    console.error('In-range error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.get('/patients/:id', authenticateAdmin, async (req, res) => {
  try {
    const patient = await User.findOne({ _id: req.params.id, ...patientFilter() }).select('-password').lean()
    if (!patient) return res.status(404).json({ message: 'Patient not found' })

    const [latestEntry, entries, appointments] = await Promise.all([
      BloodSugarEntry.findOne({ userId: patient._id }).sort({ date: -1, time: -1 }).lean(),
      BloodSugarEntry.find({ userId: patient._id }).sort({ date: -1, time: -1 }).lean(),
      Appointment.find({ userId: patient._id }).sort({ appointmentDate: -1 }).lean(),
    ])

    // Stats for this patient
    const glucoseValues = entries.map((e) => e.glucoseValue)
    const avgGlucose = glucoseValues.length ? glucoseValues.reduce((a, b) => a + b, 0) / glucoseValues.length : null
    const inRange = glucoseValues.filter((g) => g >= 4.0 && g <= 7.0).length
    const highCount = glucoseValues.filter((g) => g > 10.0).length
    const lowCount = glucoseValues.filter((g) => g < 4.0).length
    const borderline = glucoseValues.filter((g) => g > 7.0 && g <= 10.0).length

    res.json({
      ...patient,
      latestReading: latestEntry?.glucoseValue ?? null,
      stats: {
        totalEntries: entries.length,
        averageGlucose: avgGlucose ? Math.round(avgGlucose * 10) / 10 : null,
        inRange,
        borderline,
        highCount,
        lowCount,
      },
      entries,
      appointments,
    })
  } catch (err) {
    console.error('Patient detail error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.get('/patients/:id/entries', authenticateAdmin, async (req, res) => {
  try {
    const entries = await BloodSugarEntry.find({ userId: req.params.id }).sort({ date: -1, time: -1 }).lean()
    res.json(entries)
  } catch (err) {
    console.error('Patient entries error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

// ── Appointments ──────────────────────────────────────────────────

router.get('/appointments', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.query
    const filter = {}
    if (status) filter.status = status

    const appointments = await Appointment.find(filter)
      .populate('userId', 'firstName lastName email phone avatar')
      .sort({ appointmentDate: -1 })
      .lean()

    res.json(appointments)
  } catch (err) {
    console.error('Appointments list error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.post('/patients/:id/appointments', authenticateAdmin, async (req, res) => {
  try {
    const { appointmentDate, notes } = req.body
    if (!appointmentDate) return res.status(400).json({ message: 'appointmentDate required' })

    const appointment = new Appointment({
      userId: req.params.id,
      appointmentDate: new Date(appointmentDate),
      notes: notes || '',
      createdBy: req.user.id,
    })
    await appointment.save()
    res.status(201).json(appointment)
  } catch (err) {
    console.error('Create appointment error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.put('/appointments/:id', authenticateAdmin, async (req, res) => {
  try {
    const { appointmentDate, notes, status } = req.body
    const update = {}
    if (appointmentDate) update.appointmentDate = new Date(appointmentDate)
    if (notes !== undefined) update.notes = notes
    if (status) update.status = status

    const appointment = await Appointment.findByIdAndUpdate(req.params.id, { $set: update }, { new: true })
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' })
    res.json(appointment)
  } catch (err) {
    console.error('Update appointment error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

// ── Admin Management (superadmin only) ──────────────────────────────

router.get('/admins', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const admins = await User.find({ role: { $in: ['admin', 'superadmin'] } })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean()
    res.json(admins)
  } catch (err) {
    console.error('Admins list error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.delete('/users/:id', authenticateAdmin, requireSuperAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    if (user.role === 'superadmin') return res.status(403).json({ message: 'Cannot delete super admin' })

    await BloodSugarEntry.deleteMany({ userId: user._id })
    await Appointment.deleteMany({ userId: user._id })
    await ChatMessage.deleteMany({ $or: [{ senderId: user._id }, { receiverId: user._id }] })
    await User.findByIdAndDelete(user._id)

    res.json({ message: 'User deleted' })
  } catch (err) {
    console.error('Delete user error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

// ── Profile ────────────────────────────────────────────────────────

router.get('/profile', authenticateAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password').lean()
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json(user)
  } catch (err) {
    console.error('Profile error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.put('/profile', authenticateAdmin, async (req, res) => {
  try {
    const { firstName, lastName } = req.body
    const update = {}
    if (firstName) update.firstName = firstName
    if (lastName) update.lastName = lastName

    const user = await User.findByIdAndUpdate(req.user.id, { $set: update }, { new: true }).select('-password')
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json(user)
  } catch (err) {
    console.error('Update profile error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.put('/profile/change-password', authenticateAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'currentPassword and newPassword required' })
    if (newPassword.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' })

    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ message: 'User not found' })

    const valid = await user.comparePassword(currentPassword)
    if (!valid) return res.status(401).json({ message: 'Current password is incorrect' })

    user.password = newPassword
    await user.save()
    res.json({ message: 'Password updated' })
  } catch (err) {
    console.error('Change password error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

// ── Chat ────────────────────────────────────────────────────────────

router.get('/chat/conversations', authenticateAdmin, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id)
    const conversations = await ChatMessage.aggregate([
      {
        $match: {
          $or: [{ senderId: userId }, { receiverId: userId }],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ['$senderId', userId] }, '$receiverId', '$senderId'],
          },
          lastMessage: { $first: '$message' },
          lastMessageAt: { $first: '$createdAt' },
          unread: {
            $sum: {
              $cond: [{ $and: [{ $eq: ['$receiverId', req.user.id] }, { $eq: ['$readAt', null] }] }, 1, 0],
            },
          },
        },
      },
      { $sort: { lastMessageAt: -1 } },
    ])

    // Populate user details
    const userIds = conversations.map((c) => c._id)
    const users = await User.find({ _id: { $in: userIds } }).select('firstName lastName email avatar role').lean()
    const userMap = {}
    for (const u of users) userMap[u._id.toString()] = u

    const result = conversations.map((c) => ({
      ...c,
      user: userMap[c._id.toString()] || null,
    }))

    res.json(result)
  } catch (err) {
    console.error('Chat conversations error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.get('/chat/messages/:userId', authenticateAdmin, async (req, res) => {
  try {
    const myId = new mongoose.Types.ObjectId(req.user.id)
    const otherId = new mongoose.Types.ObjectId(req.params.userId)
    const messages = await ChatMessage.find({
      $or: [
        { senderId: myId, receiverId: otherId },
        { senderId: otherId, receiverId: myId },
      ],
    })
      .sort({ createdAt: 1 })
      .lean()

    // Mark messages as read
    await ChatMessage.updateMany(
      { senderId: otherId, receiverId: myId, readAt: null },
      { $set: { readAt: new Date() } }
    )

    res.json(messages)
  } catch (err) {
    console.error('Chat messages error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

router.post('/chat/messages', authenticateAdmin, async (req, res) => {
  try {
    const { receiverId, message } = req.body
    if (!receiverId || !message) return res.status(400).json({ message: 'receiverId and message required' })

    const msg = new ChatMessage({ senderId: req.user.id, receiverId, message })
    await msg.save()

    const populated = await ChatMessage.findById(msg._id)
      .populate('senderId', 'firstName lastName avatar')
      .populate('receiverId', 'firstName lastName avatar')
      .lean()

    res.status(201).json(populated)
  } catch (err) {
    console.error('Send message error:', err)
    res.status(500).json({ message: 'Server error' })
  }
})

// ── Avatar Upload ───────────────────────────────────────────────────

router.put('/profile/avatar', authenticateAdmin, (req, res) => {
  const upload = avatarStorage.single('avatar')
  upload(req, res, async (err) => {
    if (err) {
      if (err.message?.includes('file format')) return res.status(400).json({ message: err.message })
      return res.status(500).json({ message: 'Upload failed' })
    }
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' })

    try {
      const user = await User.findById(req.user.id)
      if (user.avatar) {
        const publicId = extractPublicId(user.avatar)
        if (publicId) await deleteImage(publicId)
      }

      user.avatar = req.file.path
      await user.save()
      res.json({ avatar: req.file.path })
    } catch (error) {
      console.error('Avatar upload error:', error)
      res.status(500).json({ message: 'Server error' })
    }
  })
})

export default router
