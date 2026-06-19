# Blood Sugar Tracker - Setup & Testing Guide

## Quick Start

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Configure Environment Files

**Backend (.env already configured):**
The backend `.env` file is pre-configured with:
- MongoDB connection
- JWT secret
- Resend API key for email
- API URLs

**Frontend (.env already configured):**
```
VITE_API_URL=http://localhost:5000
```

### 3. Start Development Servers

**Terminal 1 - Start Backend:**
```bash
cd backend
npm run dev
# Expected output: Server running on port 5000
# Expected output: MongoDB connected
```

**Terminal 2 - Start Frontend:**
```bash
cd frontend
npm run dev
# Opens at http://localhost:5173
```

---

## Testing User Registration & Login Flow

### Test 1: Email Verification Flow
1. Go to http://localhost:5173/register
2. Fill in form:
   - First Name: John
   - Last Name: Doe
   - Email: test@example.com
   - Phone: +1234567890
   - DOB: 1990-01-01
   - Password: Password123
3. Click "Create Account"
4. Check your email for 6-digit verification code
5. Enter code on verification page
6. Should see "Email verified!" and redirect to login

### Test 2: Email Sending
If email is not received:
1. Check backend logs for Resend errors
2. Verify RESEND_API_KEY in .env is correct
3. Check spam folder

### Test 3: Login after Verification
1. After verification, go to /login
2. Enter email: test@example.com
3. Enter password: Password123
4. Click "Sign In"
5. Should redirect to dashboard (/)

### Test 4: Protected Routes
1. Clear token: Open DevTools → Application → Storage → Remove token
2. Try to access http://localhost:5173/
3. Should redirect to /login

---

## Testing OAuth (Google & GitHub)

### Prerequisites:
Complete the OAuth setup from `OAUTH_EMAIL_SETUP.md`

### Google OAuth Test:
1. Go to http://localhost:5173/login
2. Click "Continue with Google"
3. Sign in with your Google account
4. Should redirect to dashboard
5. Token should be stored in localStorage

### GitHub OAuth Test:
1. Go to http://localhost:5173/login
2. Click "Continue with GitHub"
3. Authorize the app
4. Should redirect to dashboard

---

## API Endpoints Reference

### Authentication Routes

**POST /api/auth/register**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "test@example.com",
  "phone": "+1234567890",
  "dob": "1990-01-01",
  "password": "Password123"
}
```

**POST /api/auth/verify**
```json
{
  "email": "test@example.com",
  "code": "123456"
}
```

**POST /api/auth/resend-code**
```json
{
  "email": "test@example.com"
}
```

**POST /api/auth/login**
```json
{
  "email": "test@example.com",
  "password": "Password123"
}
```

**GET /api/auth/google** - Initiates Google OAuth

**GET /api/auth/github** - Initiates GitHub OAuth

### Blood Sugar Entries (Requires Authorization Header)

**GET /api/entries**
- Headers: `Authorization: Bearer <token>`
- Returns: All entries for user

**POST /api/entries**
```json
{
  "date": "2024-01-15",
  "time": "09:30",
  "glucoseValue": 120,
  "mealType": "breakfast",
  "foodEaten": "Pancakes",
  "carbs": 45,
  "insulinUnits": 8,
  "notes": "Morning reading"
}
```

---

## Troubleshooting

### Backend Issues

**MongoDB Connection Error:**
```
MongoDB connection error: MongoServerError
```
- Check MongoDB URI in .env is correct
- Verify MongoDB Atlas cluster is active
- Check IP whitelist includes your current IP

**Port Already in Use:**
```
Error: listen EADDRINUSE :::5000
```
- Change PORT in .env to different number (e.g., 5001)
- Or kill process: `lsof -i :5000` then `kill -9 <PID>`

**Passport Module Not Found:**
```
Cannot find module 'passport'
```
- Run `npm install` in backend directory
- Check node_modules folder exists

### Frontend Issues

**API Connection Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:5000
```
- Ensure backend server is running
- Check VITE_API_URL in .env is correct
- Check frontend proxy settings in vite.config.js

**Blank Page or 404:**
- Check browser console for errors
- Verify vite server is running on port 5173
- Clear browser cache and refresh

### Email Issues

**Email Not Received:**
1. Check spam folder
2. Verify RESEND_API_KEY in .env is correct
3. Check Resend dashboard for delivery logs
4. Ensure EMAIL_FROM uses a verified domain in Resend

---

## File Structure Overview

```
backend/
├── index.js                 # Server entry point
├── .env                    # Environment variables
├── package.json            # Dependencies
├── middleware/
│   └── auth.js            # JWT authentication
├── models/
│   ├── User.js            # User schema
│   ├── BloodSugarEntry.js # Entry schema
│   └── VerificationCode.js # Verification code schema
├── routes/
│   ├── auth.js            # Auth routes (register, login, verify)
│   ├── oauth.js           # OAuth routes (Google, GitHub, etc)
│   ├── entries.js         # Blood sugar entries routes
│   └── trends.js          # Trends/analytics routes
└── utils/
    └── email.js           # Email sending utility

frontend/
├── src/
│   ├── main.jsx           # Entry point
│   ├── App.jsx            # Main app component
│   ├── contexts/
│   │   └── AuthContext.jsx # Auth context & hooks
│   ├── lib/
│   │   ├── axios.js       # Axios configuration
│   │   └── utils.js       # Utility functions
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Verify.jsx
│   │   ├── OAuthCallback.jsx
│   │   └── Dashboard.jsx
│   └── components/
│       └── ...
├── .env                    # Environment variables
└── vite.config.js         # Vite configuration
```

---

## Production Deployment Checklist

- [ ] Update JWT_SECRET to strong random string
- [ ] Update MongoDB URI to production database
- [ ] Configure OAuth callback URLs for production domain
- [ ] Update FRONTEND_URL and BACKEND_URL to production URLs
- [ ] Resend is already production-ready
- [ ] Enable HTTPS for all endpoints
- [ ] Set NODE_ENV=production
- [ ] Enable CORS properly for production domain only
- [ ] Set up database backups
- [ ] Configure error logging and monitoring
- [ ] Test all OAuth providers with production URLs
- [ ] Set up CI/CD pipeline

---

## Additional Resources

- [Express.js Documentation](https://expressjs.com)
- [MongoDB Documentation](https://docs.mongodb.com)
- [React Documentation](https://react.dev)
- [Passport.js Documentation](https://passportjs.org)
- [JWT Documentation](https://jwt.io)
