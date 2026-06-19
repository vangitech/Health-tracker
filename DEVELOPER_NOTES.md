# Developer Notes - Blood Sugar Tracker Architecture

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         USER BROWSER                        │
│                    (React App on 5174)                      │
└────────────┬────────────────────────────────────┬───────────┘
             │ HTTP/CORS                          │
             ▼                                    ▼
     ┌─────────────────┐              ┌──────────────────────┐
     │  Axios Client   │              │  OAuth Providers     │
     │  (lib/axios)    │              │  (Google, GitHub)    │
     └────────┬────────┘              └──────────────────────┘
             │ API Requests                   │
             ▼                                │
┌─────────────────────────────────────────────────────────────┐
│            EXPRESS SERVER (Backend on 5000)                 │
├─────────────────────────────────────────────────────────────┤
│  Routes:                                                    │
│  - /api/auth (register, login, verify, resend-code)       │
│  - /api/auth/google, github, etc (OAuth callbacks)        │
│  - /api/entries (CRUD operations)                         │
│  - /api/trends (analytics)                                │
├─────────────────────────────────────────────────────────────┤
│  Middleware:                                                │
│  - CORS (enables frontend-backend communication)          │
│  - Express JSON (parses request bodies)                   │
│  - Passport (OAuth authentication)                        │
│  - Custom auth middleware (JWT verification)             │
└────────────┬────────────────────────────────────┬──────────┘
             │ Query/Save                         │
             ▼                                    ▼
     ┌─────────────────────┐            ┌──────────────────┐
     │   MongoDB Atlas     │            │   Gmail SMTP     │
     │   (User Data)       │            │   (Email)        │
     └─────────────────────┘            └──────────────────┘
```

---

## Data Flow: User Registration

```
1. USER ENTERS DATA
   └─► Frontend: /register page
   
2. FORM SUBMISSION
   └─► POST http://localhost:5000/api/auth/register
       Payload: {firstName, lastName, email, phone, dob, password}
   
3. BACKEND VALIDATION
   └─► Express validator checks all fields
   └─► Checks if email already exists
   
4. CREATE USER
   └─► Hash password with bcrypt
   └─► Save to MongoDB
   
5. GENERATE VERIFICATION CODE
   └─► Create 6-digit random code
   └─► Set 10-minute expiration
   └─► Save to VerificationCode collection
   
6. SEND EMAIL
   └─► Nodemailer uses Gmail SMTP
   └─► Sends verification code to user email
   
7. FRONTEND RESPONSE
   └─► Redirect to /verify page
   └─► Display verification code input
   
8. USER VERIFIES
   └─► POST /api/auth/verify with code
   
9. VERIFICATION
   └─► Check code validity & expiration
   └─► Update user.isVerified = true
   └─► Delete verification code
   
10. COMPLETION
    └─► Redirect to /login
```

---

## Data Flow: User Login

```
1. USER ENTERS CREDENTIALS
   └─► Frontend: /login page
   
2. FORM SUBMISSION
   └─► POST http://localhost:5000/api/auth/login
       Payload: {email, password}
   
3. BACKEND VALIDATION
   └─► Find user by email
   └─► Check if email is verified
   └─► Compare password with bcrypt hash
   
4. TOKEN GENERATION
   └─► Create JWT token with:
       - user._id
       - user.email
       - Expiration: 7 days
   
5. TOKEN STORAGE (Frontend)
   └─► Save token to localStorage
   └─► Set as Authorization header in axios
       Header: "Authorization: Bearer <token>"
   
6. REDIRECT
   └─► Navigate to dashboard (/)
   
7. PROTECTED ROUTE ACCESS
   └─► React checks if user exists in AuthContext
   └─► Token sent with all subsequent API requests
   └─► Server verifies JWT signature
```

---

## Data Flow: OAuth (Google Example)

```
1. USER CLICKS "Continue with Google"
   └─► Frontend redirects to: GET /api/auth/google
   
2. PASSPORT REDIRECTS TO GOOGLE
   └─► User sees Google login screen
   
3. USER AUTHORIZES
   └─► Google redirects back with code
   
4. PASSPORT EXCHANGES CODE FOR DATA
   └─► Gets user profile (name, email, photo)
   
5. FIND OR CREATE USER
   └─► Check if user exists with provider='google'
   └─► If not, create new user
   └─► Mark as verified (isVerified=true)
   
6. GENERATE JWT TOKEN
   └─► Same as email/password flow
   
7. REDIRECT TO FRONTEND
   └─► GET /api/auth/google/callback?token=<jwt>
   └─► Redirects to: /auth/callback?token=<jwt>
   
8. FRONTEND HANDLES CALLBACK
   └─► Extracts token from URL
   └─► Stores in localStorage
   └─► Sets axios Authorization header
   └─► Redirects to dashboard
```

---

## Key Design Decisions

### 1. Axios Configuration (lib/axios.js)
- **Why:** Centralized API URL management
- **Benefit:** Easy to switch between dev/prod URLs
- **Implementation:** 
  - Set baseURL in axios.defaults
  - Add response interceptor for 401 errors
  - Auto-logout on token expiration

### 2. JWT Authentication
- **Why:** Stateless, scalable, works with microservices
- **Token Contents:** user._id, email
- **Storage:** localStorage (frontend)
- **Expiration:** 7 days
- **Verification:** Custom middleware checks signature

### 3. Passport for OAuth
- **Why:** Industry standard, supports multiple providers
- **Strategy:** OAuth2.0 for Google/GitHub, custom for Apple/Yahoo
- **Session:** Disabled (stateless API)
- **Callback:** Token passed via URL to frontend

### 4. Email Verification
- **Why:** Prevents spam/fake emails, improves data quality
- **Code:** 6-digit random number
- **Expiry:** 10 minutes
- **Resend:** User can request new code
- **Medium:** Resend API for email delivery

### 5. Password Hashing
- **Algorithm:** bcrypt
- **Rounds:** 10 (default in npm package)
- **Storage:** Only hashed password in DB
- **Verification:** comparePassword method

### 6. Glucose Validation
- **Range:** 0-600 mg/dL
- **Why:** Normal human blood glucose range (40-600)
- **Validation:** Both route and model level

### 7. CORS Configuration
- **Origin:** Restricted to FRONTEND_URL
- **Credentials:** Allowed for cookie-based auth
- **Methods:** GET, POST, PUT, DELETE
- **Headers:** Authorization, Content-Type

---

## Security Measures

### Frontend Security
- ✅ Token stored in localStorage (XSS vulnerable but simple)
- ✅ Token sent in Authorization header (not in URL)
- ✅ Auto-logout on 401 response
- ✅ Protected routes with AuthContext
- ✅ No sensitive data in localStorage

### Backend Security
- ✅ Password hashing with bcrypt
- ✅ JWT signature verification
- ✅ Input validation (express-validator)
- ✅ CORS enabled (origin check)
- ✅ Environment variables for secrets
- ✅ MongoDB URI in env (not hardcoded)

### Email Security
- ✅ Gmail app-specific password (not main account)
- ✅ SMTP over TLS/SSL
- ✅ Time-limited verification codes
- ✅ Email verification before account activation

### OAuth Security
- ✅ Passport handles OAuth state validation
- ✅ Secrets not exposed to frontend
- ✅ Token revocation on logout
- ✅ OAuth provider URLs used (not localhost)

---

## Error Handling Strategy

### Frontend Error Handling
```javascript
// 1. Network errors (caught by axios interceptor)
if (error.response?.status === 401) {
  // Clear token, redirect to login
}

// 2. Validation errors (shown in UI)
if (error.response?.data?.message) {
  // Display error message
}

// 3. Server errors (logged to console)
console.error(error)
```

### Backend Error Handling
```javascript
// 1. Validation errors (400)
if (!errors.isEmpty()) {
  return res.status(400).json({ errors })
}

// 2. Authentication errors (401)
if (!isMatch) {
  return res.status(401).json({ message: 'Invalid credentials' })
}

// 3. Authorization errors (403)
if (err.name === 'JsonWebTokenError') {
  return res.status(403).json({ message: 'Invalid token' })
}

// 4. Not found errors (404)
if (!user) {
  return res.status(404).json({ message: 'User not found' })
}

// 5. Server errors (500)
catch (error) {
  res.status(500).json({ message: 'Server error' })
}
```

---

## Performance Considerations

### Database Queries
- ✅ Use .findOne() for single record lookups
- ✅ Add .sort() and .limit() for lists
- ✅ Index user emails for faster lookups
- ⚠️ MongoDB indexes: email field should be indexed

### API Response Time
- Average: 50-100ms for local requests
- Bottleneck: Email sending (2-3 seconds)
- Optimization: Make email async

### Frontend Performance
- ✅ Lazy loading routes with React Router
- ✅ Debounce API requests
- ✅ Proper error boundaries
- ✅ Optimized re-renders

### Memory Usage
- ✅ Token cleanup on logout
- ✅ Proper stream handling for large files
- ✅ Connection pooling for MongoDB

---

## Testing Checklist

### Unit Tests Needed
- [ ] Password hashing
- [ ] JWT token generation
- [ ] Email validation regex
- [ ] Glucose value validation
- [ ] User model methods

### Integration Tests Needed
- [ ] Complete registration flow
- [ ] Email verification
- [ ] Login with JWT
- [ ] OAuth flow
- [ ] Protected route access
- [ ] Blood sugar entry CRUD

### E2E Tests Needed
- [ ] User registration to dashboard
- [ ] Login persistence across sessions
- [ ] Token expiration handling
- [ ] OAuth callback handling
- [ ] Email verification process

---

## Deployment Considerations

### Environment-Specific Configuration
```
Development:
- VITE_API_URL=http://localhost:5000
- NODE_ENV=development
- JWT_SECRET=dev-secret

Production:
- VITE_API_URL=https://api.sugarcare.com
- NODE_ENV=production
- JWT_SECRET=<strong-random-secret>
- All URLs must use HTTPS
```

### Database
- Development: MongoDB Atlas free tier
- Production: MongoDB Atlas paid tier with:
  - Automated backups
  - Multi-region replication
  - Point-in-time recovery
  - VPC endpoint

### Email Service
- Development: Gmail SMTP
- Production: SendGrid or AWS SES for:
  - Better deliverability
  - Higher sending limits
  - Bounce handling
  - Email analytics

### Infrastructure
- Frontend: Vercel or Netlify
- Backend: Railway, Heroku, or AWS
- Database: MongoDB Atlas
- Email: SendGrid or AWS SES
- OAuth: Google Cloud, GitHub, Apple Developer

---

## Maintenance & Monitoring

### Logs to Monitor
- Express server logs (startup, errors)
- MongoDB connection logs
- API error logs (400, 500 status codes)
- Email sending failures
- OAuth authentication failures

### Regular Tasks
- [ ] Backup MongoDB regularly
- [ ] Monitor JWT expiration issues
- [ ] Check email delivery rates
- [ ] Review error logs weekly
- [ ] Update dependencies monthly
- [ ] Security patches immediately

### Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Connection refused | Backend not running | Start backend server |
| Invalid token | Expired JWT | User needs to re-login |
| Email not sent | Gmail credentials wrong | Check app-specific password |
| CORS error | Origin not whitelisted | Update FRONTEND_URL in .env |
| MongoDB connection fails | Network issue | Check MongoDB Atlas IP whitelist |

---

## Future Improvements

- [ ] Add refresh token for better security
- [ ] Implement password reset email
- [ ] Add rate limiting on API endpoints
- [ ] Add API request logging/analytics
- [ ] Implement data encryption at rest
- [ ] Add two-factor authentication
- [ ] Implement role-based access control
- [ ] Add blood sugar trend predictions
- [ ] Integrate health device APIs
- [ ] Add mobile app (React Native)
