import jwt from 'jsonwebtoken'

export function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ message: 'Access token required' })
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' })
    }
    const allowedRoles = ['admin', 'superadmin', 'doctor', 'recordofficer', 'nurse']
    if (!allowedRoles.includes(decoded.role)) {
      return res.status(403).json({ message: 'Admin access required' })
    }
    req.user = decoded
    next()
  })
}

export function requireSuperAdmin(req, res, next) {
  if (req.user?.role !== 'superadmin') {
    return res.status(403).json({ message: 'Super admin access required' })
  }
  next()
}
