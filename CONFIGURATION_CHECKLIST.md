# Configuration Checklist - Blood Sugar Tracker

## ✅ Completed - Application Ready

- [x] Backend server configured and running
- [x] Frontend server configured and running
- [x] MongoDB connection established
- [x] API endpoints functional
- [x] User registration flow working
- [x] JWT authentication implemented
- [x] Protected routes implemented
- [x] Error handling implemented

---

## ✅ Email Configuration (Resend - Already Configured)

Email sending is powered by **Resend** and pre-configured. No extra action needed.

---

## 🔐 OPTIONAL: Configure Google OAuth

### Step-by-Step Guide

#### 1. Create Google Cloud Project
- [ ] Go to https://console.cloud.google.com
- [ ] Click **Select a Project** (top navbar)
- [ ] Click **New Project**
- [ ] Enter name: "Blood Sugar Tracker"
- [ ] Click **Create**

#### 2. Enable Google+ API
- [ ] Wait for project to be created
- [ ] Go to **APIs & Services** (left sidebar)
- [ ] Click **Library**
- [ ] Search for "Google+ API"
- [ ] Click on **Google+ API**
- [ ] Click **Enable**

#### 3. Create OAuth 2.0 Credentials
- [ ] Go to **APIs & Services** → **Credentials** (left sidebar)
- [ ] Click **+ Create Credentials** (top button)
- [ ] Select **OAuth client ID**
- [ ] Choose **Web application**
- [ ] Under **Authorized Redirect URIs**, click **Add URI**
- [ ] Add: `http://localhost:5000/api/auth/google/callback`
- [ ] Click **Create**

#### 4. Copy Credentials
- [ ] In the popup, you'll see:
  - **Client ID** (long string)
  - **Client Secret** (another long string)
- [ ] Copy both values

#### 5. Update .env File
- [ ] Open `backend/.env`
- [ ] Find:
  ```env
  GOOGLE_CLIENT_ID=
  GOOGLE_CLIENT_SECRET=
  ```
- [ ] Update to:
  ```env
  GOOGLE_CLIENT_ID=<your-client-id>
  GOOGLE_CLIENT_SECRET=<your-client-secret>
  ```

#### 6. Restart Backend
- [ ] Stop backend: `Ctrl+C`
- [ ] Start backend: `npm run dev`

#### 7. Test Google OAuth
- [ ] Go to http://localhost:5174/login
- [ ] Click **Continue with Google**
- [ ] Sign in with your Google account
- [ ] Should redirect to dashboard

✅ **Status:** Google OAuth configured

---

## 🔐 OPTIONAL: Configure GitHub OAuth

### Step-by-Step Guide

#### 1. Create GitHub OAuth App
- [ ] Go to https://github.com/settings/developers
- [ ] Click **New OAuth App**
- [ ] Fill in the form:
  - **Application name:** Blood Sugar Tracker
  - **Homepage URL:** http://localhost:5173
  - **Authorization callback URL:** http://localhost:5000/api/auth/github/callback
- [ ] Click **Register application**

#### 2. Generate Client Secret
- [ ] On the next page, you'll see **Client ID**
- [ ] Click **Generate a new client secret**
- [ ] Copy both **Client ID** and **Client Secret**

#### 3. Update .env File
- [ ] Open `backend/.env`
- [ ] Find:
  ```env
  GITHUB_CLIENT_ID=
  GITHUB_CLIENT_SECRET=
  ```
- [ ] Update to:
  ```env
  GITHUB_CLIENT_ID=<your-client-id>
  GITHUB_CLIENT_SECRET=<your-client-secret>
  ```

#### 4. Restart Backend
- [ ] Stop backend: `Ctrl+C`
- [ ] Start backend: `npm run dev`

#### 5. Test GitHub OAuth
- [ ] Go to http://localhost:5174/login
- [ ] Click **Continue with GitHub**
- [ ] Authorize the app
- [ ] Should redirect to dashboard

✅ **Status:** GitHub OAuth configured

---

## 🍎 OPTIONAL: Configure Apple OAuth (Advanced)

### Prerequisites
- Apple Developer Account ($99/year)
- Team ID and App ID setup

### Step-by-Step Guide
- [ ] Follow detailed instructions in `OAUTH_EMAIL_SETUP.md`
- [ ] Create Service ID for your app
- [ ] Download private key (.p8 file)
- [ ] Save key to: `backend/apple-private-key.p8`
- [ ] Update `backend/.env` with credentials
- [ ] Test "Continue with Apple" button

---

## 🧪 Final Testing Checklist

### User Registration Test
- [ ] Navigate to http://localhost:5174/register
- [ ] Register with any email (e.g., test@example.com)
- [ ] Verify code received in email (if configured)
- [ ] Enter code and verify success
- [ ] Redirected to login page

### User Login Test
- [ ] Go to http://localhost:5174/login
- [ ] Enter your registered email and password
- [ ] Click "Sign In"
- [ ] Redirected to dashboard

### Protected Route Test
- [ ] Clear localStorage token (DevTools → Application → Storage)
- [ ] Try to access http://localhost:5174/
- [ ] Should redirect to login page

### OAuth Test (if configured)
- [ ] Go to http://localhost:5174/login
- [ ] Click "Continue with Google" (or GitHub)
- [ ] Complete OAuth flow
- [ ] Should redirect to dashboard

### Blood Sugar Entry Test
- [ ] Log in to dashboard
- [ ] Create a new blood sugar entry
- [ ] Verify entry appears in list
- [ ] Try to edit and delete entries

---

## 🚀 Production Deployment Checklist

### Before Deploying
- [ ] Change JWT_SECRET to random strong string
- [ ] Update FRONTEND_URL to production domain
- [ ] Update BACKEND_URL to production domain
- [ ] Enable HTTPS on both frontend and backend
- [ ] Set NODE_ENV=production
- [ ] Configure production email service (SendGrid, AWS SES)
- [ ] Update OAuth redirect URLs to production
- [ ] Enable MongoDB backups
- [ ] Set up error logging (Sentry, LogRocket)
- [ ] Set up monitoring (uptime, performance)

### OAuth Production Setup
- [ ] Update Google OAuth callback: `https://api.yourdomain.com/api/auth/google/callback`
- [ ] Update GitHub OAuth callback: `https://api.yourdomain.com/api/auth/github/callback`
- [ ] Update Apple OAuth callback: `https://api.yourdomain.com/api/auth/apple/callback`
- [ ] Update Frontend URLs in OAuth provider settings

### Database
- [ ] Upgrade MongoDB Atlas to paid tier
- [ ] Enable automated backups
- [ ] Enable point-in-time recovery
- [ ] Set up database replication
- [ ] Enable IP whitelist for production servers

### Performance
- [ ] Enable caching (Redis)
- [ ] Set up CDN for static assets
- [ ] Configure database indexes
- [ ] Monitor API response times
- [ ] Set up load balancing

---

## ✨ Summary

### What You Have Now
✅ Fully functional registration system  
✅ Email verification (when configured)  
✅ Secure login with JWT  
✅ OAuth ready (needs credentials)  
✅ Blood sugar tracking  
✅ Responsive UI  

### What To Do Next
1. **REQUIRED:** Nothing! App works without OAuth
2. ✅ **Email:** Already configured via Resend
3. **OPTIONAL:** Configure OAuth providers
4. **DEPLOY:** Follow production checklist

### Commands to Remember
```bash
# Start Backend (Terminal 1)
cd backend && npm run dev

# Start Frontend (Terminal 2)
cd frontend && npm run dev

# Visit
http://localhost:5174/register  # Register
http://localhost:5174/login      # Login
http://localhost:5174/           # Dashboard

# Restart after .env changes
# Stop both servers and start again
```

---

## 📞 Support

### If Something Breaks
1. Check logs in terminal where server runs
2. Verify .env file has all required fields
3. Restart both servers
4. Clear browser cache (Ctrl+Shift+Delete)
5. Check MongoDB connection: https://cloud.mongodb.com

### Common Errors
| Error | Fix |
|-------|-----|
| "Cannot find module" | Run `npm install` |
| "EADDRINUSE" | Port in use, kill process or change PORT |
| "Connection refused" | Backend not running |
| "Email not sent" | Check RESEND_API_KEY in .env |
| "OAuth failed" | Check Client ID/Secret in .env |

---

**✅ SETUP COMPLETE! Your app is ready to use.**

Next: Optional Gmail & OAuth configuration, then deployment!
