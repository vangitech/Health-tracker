# 🔧 Backend Port & CORS Fix - COMPLETE

## 🎯 Problem Fixed

You were getting **HTTP 403 Forbidden** error because:

1. **Port Conflict:** macOS had port 5000 (AirPlay) blocking your backend
2. **Frontend Port Mismatch:** Frontend was running on 5174, but CORS allowed only 5173
3. **API URL Mismatch:** Frontend couldn't find the backend API

## ✅ What Was Fixed

### Backend Configuration
- ✅ Changed port: 5000 → **5001** (avoids macOS AirPlay conflict)
- ✅ Updated `BACKEND_URL=http://localhost:5001`
- ✅ Fixed CORS to allow both port 5173 and 5174
- ✅ Added multiple allowed origins
- ✅ Added health check endpoint `/health`
- ✅ Added API info endpoint `/api`

### Frontend Configuration
- ✅ Updated `VITE_API_URL=http://localhost:5001`
- ✅ Improved axios error logging
- ✅ Added network error handling
- ✅ Token handling in requests

## 🚀 Current Status

| Component | Port | Status |
|-----------|------|--------|
| Backend API | 5001 | ✅ Running |
| Frontend | 5174 | ✅ Running |
| MongoDB | - | ✅ Connected |

## 📝 Next Steps

### 1. Hard Refresh Frontend
Open your browser and do a **hard refresh**:
- **Mac/Windows:** `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Or: Open DevTools → Settings → Network → Check "Disable cache" while DevTools open

### 2. Open Application
Go to: **http://localhost:5174**

### 3. Test Registration
1. Click **Sign Up**
2. Enter test data:
   - First Name: John
   - Last Name: Doe
   - Email: test@gmail.com
   - Phone: +1234567890
   - DOB: 1990-01-01
   - Password: Password123
3. Click **Create Account**
4. You should see verification screen or success message

### 4. Test Login
1. Click **Sign In**
2. Enter test email & password
3. Should redirect to dashboard

## 📊 How to Check If It's Working

### Check Backend
```bash
curl http://localhost:5001/health
# Should respond with:
# {"status":"ok","message":"Server is running",...}
```

### Check Frontend  
```bash
curl http://localhost:5174
# Should respond with HTML page
```

### Check Browser Console
Open DevTools (F12 or Cmd+Option+J) and check Console for:
- ✅ "🔧 Axios configured with API URL: http://localhost:5001"
- ✅ "📤 Sending request with token" (when logging in)
- ✅ "✅ Response received: 201" (when registering)

## 🐛 If Still Getting 403 Error

### Step 1: Check Backend Status
```bash
# Check if backend is running
lsof -i :5001

# Should show nodemon process, if not run:
cd backend && npm run dev
```

### Step 2: Check Terminals
- Backend terminal: Should show "Server running on port 5001"
- Frontend terminal: Should show "Local: http://localhost:5174"

### Step 3: Hard Refresh Again
- Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- Then wait 5 seconds for page to load
- Check browser DevTools console for errors

### Step 4: Check .env Files
Verify both files have correct URLs:

**Backend: `/backend/.env`**
```env
PORT=5001
BACKEND_URL=http://localhost:5001
FRONTEND_URL=http://localhost:5174
```

**Frontend: `/frontend/.env`**
```env
VITE_API_URL=http://localhost:5001
```

## 🎯 Expected Console Output

### When Page Loads
```
🔧 Axios configured with API URL: http://localhost:5001
```

### When Registering
```
📤 Sending request with token
✅ Response received: 201
```

### When Logging In
```
📤 Sending request with token
✅ Response received: 200
```

## ⚠️ Important Notes

1. **Don't use port 5000** - macOS reserves it for AirPlay
2. **Hard refresh is required** - Environment variables won't update without it
3. **Keep both terminals running** - Backend and Frontend need separate terminals
4. **Check console for errors** - DevTools console (F12) shows detailed error messages

## 📞 Troubleshooting Commands

```bash
# Kill process on port (if needed)
lsof -i :5001  # Check what's using 5001
kill -9 <PID>  # Kill it

# Restart backend
cd backend
npm run dev

# Check backend is responding
curl http://localhost:5001/health

# Check frontend is responding  
curl http://localhost:5174

# View environment variables
cat backend/.env | grep PORT
cat backend/.env | grep BACKEND_URL
cat frontend/.env | grep VITE_API
```

## ✨ Summary

### What Changed
- Backend: Port 5000 → **5001**
- Frontend API URL: http://localhost:5000 → **http://localhost:5001**
- CORS: Now allows port 5174

### What To Do Now
1. ✅ Backend running on 5001
2. ⏳ Hard refresh browser (Cmd+Shift+R)
3. 🧪 Test signup → login flow
4. ✅ App should work!

---

**If you still get 403 error after hard refresh:**
1. Open DevTools (F12)
2. Go to Console tab
3. Copy any error messages
4. Check that backend shows "Server running on port 5001"
