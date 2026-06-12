# OAuth & Email Configuration Guide

## Prerequisites
- Configured backend server running on http://localhost:5000
- Configured frontend running on http://localhost:5173

## 1. Gmail Configuration for Email Verification

### For Gmail App Passwords (Recommended):
1. Go to your Google Account: https://myaccount.google.com
2. Navigate to **Security** (left sidebar)
3. Enable **2-Step Verification** if not already enabled
4. Go back to Security and look for **App passwords**
5. Select **Mail** and **Windows Computer** (or your device)
6. Google will generate a 16-character password
7. Copy this password and update your `.env` file:

```env
EMAIL_USER=softwarekings001@gmail.com
EMAIL_PASS=<16-character-app-password>
```

**Note:** Do NOT use your regular Gmail password. Use the app-specific password.

---

## 2. Google OAuth Setup

### Step 1: Create Google Cloud Project
1. Go to https://console.cloud.google.com
2. Click **Select a Project** → **New Project**
3. Enter project name: "Blood Sugar Tracker"
4. Click **Create**

### Step 2: Enable OAuth 2.0
1. In the left sidebar, go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click it and press **Enable**

### Step 3: Create OAuth 2.0 Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth client ID**
3. Choose **Web application**
4. Add Authorized Redirect URIs:
   - `http://localhost:5000/api/auth/google/callback`
   - `http://localhost:5173` (for development)
5. Click **Create**
6. Copy the **Client ID** and **Client Secret**
7. Add to `.env`:

```env
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>
```

---

## 3. GitHub OAuth Setup

### Step 1: Create GitHub App
1. Go to https://github.com/settings/developers
2. Click **New OAuth App**
3. Fill in:
   - **Application name:** Blood Sugar Tracker
   - **Homepage URL:** http://localhost:5173
   - **Authorization callback URL:** http://localhost:5000/api/auth/github/callback
4. Click **Register application**

### Step 2: Generate Client Secret
1. Click **Generate a new client secret**
2. Copy both **Client ID** and **Client Secret**
3. Add to `.env`:

```env
GITHUB_CLIENT_ID=<your-client-id>
GITHUB_CLIENT_SECRET=<your-client-secret>
```

---

## 4. Apple OAuth Setup (Optional)

Apple OAuth requires additional setup:

### Step 1: Apple Developer Account
1. Go to https://developer.apple.com/account
2. Create an app ID for "Blood Sugar Tracker"
3. Enable "Sign in with Apple" capability

### Step 2: Create Service ID
1. Go to **Identifiers**
2. Create new **Service IDs**
3. Configure return URLs:
   - `http://localhost:5000/api/auth/apple/callback`

### Step 3: Create Private Key
1. Go to **Keys** and create new key
2. Enable "Sign in with Apple"
3. Download the `.p8` private key
4. Save to `backend/apple-private-key.p8`
5. Add to `.env`:

```env
APPLE_CLIENT_ID=<your-service-id>
APPLE_TEAM_ID=<your-team-id>
APPLE_KEY_ID=<your-key-id>
APPLE_PRIVATE_KEY_PATH=./apple-private-key.p8
```

---

## 5. Yahoo OAuth Setup (Optional)

### Step 1: Yahoo Developer Account
1. Go to https://developer.yahoo.com
2. Create a new app
3. Configure callback URL:
   - `http://localhost:5000/api/auth/yahoo/callback`

### Step 2: Get Credentials
1. Copy Client ID and Client Secret
2. Add to `.env`:

```env
YAHOO_CLIENT_ID=<your-client-id>
YAHOO_CLIENT_SECRET=<your-client-secret>
```

---

## Complete Backend .env Template

```env
# Server
PORT=5000
MONGODB_URI=mongodb+srv://softwarekings001_db_user:esdoHRdSGfXYyICQ@health-tracker.ewl55ew.mongodb.net/?appName=Health-tracker
JWT_SECRET=your_super_secret_jwt_key_change_this
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=softwarekings001@gmail.com
EMAIL_PASS=<app-password>

# OAuth - Google
GOOGLE_CLIENT_ID=<your-id>
GOOGLE_CLIENT_SECRET=<your-secret>

# OAuth - GitHub
GITHUB_CLIENT_ID=<your-id>
GITHUB_CLIENT_SECRET=<your-secret>

# OAuth - Apple (optional)
APPLE_CLIENT_ID=
APPLE_TEAM_ID=
APPLE_KEY_ID=
APPLE_PRIVATE_KEY_PATH=

# OAuth - Yahoo (optional)
YAHOO_CLIENT_ID=
YAHOO_CLIENT_SECRET=
```

---

## Testing the Setup

### 1. Test Email Sending
Run this in backend terminal:
```bash
npm run dev
```
Register a new account and check if verification email arrives.

### 2. Test Google OAuth
1. Start both servers
2. Click "Continue with Google" on login page
3. Sign in with your Google account
4. Should redirect to dashboard

### 3. Test GitHub OAuth
1. Click "Continue with GitHub" on login page
2. Authorize the app
3. Should redirect to dashboard

---

## Troubleshooting

### Email not sending?
- Check that Gmail 2FA is enabled
- Verify app-specific password is correct
- Check backend logs for nodemailer errors

### OAuth redirect not working?
- Ensure callback URLs match exactly in OAuth provider settings
- Check that FRONTEND_URL and BACKEND_URL in .env are correct
- Clear browser cookies and try again

### Token not passing to frontend?
- Check browser console for errors
- Verify JWT_SECRET is set
- Check OAuth callback URL format

---

## Production Deployment

When deploying to production:
1. Update all URLs to your production domain
2. Use environment-specific .env files
3. Ensure MongoDB connection is from production database
4. Use strong JWT_SECRET
5. Enable HTTPS for all OAuth callbacks
6. Use production email service (not Gmail app password)
