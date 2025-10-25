# 📧 Fix Gmail Email - Quick Solution

## **Current Issue:**
- OTP is working (code: 384190)
- But email is not being sent to your inbox
- Need to fix Gmail authentication

## **🔧 Quick Fix (2 Steps):**

### **Step 1: Create .env File**
Create a file named `.env` in the `backend` directory with this content:

```env
MONGODB_URI=mongodb+srv://talezshort_db_user:xPcgBuCOO6WEOUFq@cluster0.nexvefr.mongodb.net/cardtracker_pro
JWT_SECRET=8f2a9d4e7b1c6f3a8e5d2b9c4f7a1e6d3b8f5a2e9c4b7d1f6a3e8b5c2d9f4a7e1b6c3f8a5d2e9b4c7f1a6d3e8b5c2f9a4e7b1d6c3f8a5e2b9c4f7d1a8e5b2c9f6a3e8d5b2c9f4a7e1b6d3c8f5a2e9b4c7f1a6d3e8b5c2f9a4e7b1
PORT=3001
NODE_ENV=development
EMAIL_USER=codeprabhas121@gmail.com
EMAIL_PASS=uzyfhtzqnajynnsw
```

**Important:** 
- Remove spaces from app password: `uzyfhtzqnajynnsw` (not `uzyf htzq najy nnsw`)
- Use your exact Gmail address: `codeprabhas121@gmail.com`

### **Step 2: Fix Gmail App Password**

The app password might be wrong. Get a new one:

1. **Go to:** [Google Account Settings](https://myaccount.google.com/)
2. **Security** → **2-Step Verification**
3. **App passwords** → **Mail** → **Generate**
4. **Copy the new 16-character password** (no spaces)
5. **Update .env file** with the new password

## **🧪 Test After Fix:**

1. **Restart the backend server**
2. **Go to:** `/reset-password`
3. **Enter:** `codeprabhas121@gmail.com`
4. **Check your Gmail inbox** for the OTP email

## **📧 Expected Email:**

You should receive:
- **From:** codeprabhas121@gmail.com
- **Subject:** CardTracker Pro - Password Reset OTP
- **Content:** Beautiful HTML template with OTP code

## **🔄 Alternative: Use Console Mode**

If Gmail still doesn't work, switch back to console mode:

In `backend/routes/auth.js`, change line 6 to:
```javascript
const { sendOTPEmail } = require('../services/emailServiceConsole');
```

Then OTP will show in terminal (like it's doing now).

## **✅ Current Status:**
- **OTP Generation:** ✅ Working (384190)
- **Backend Server:** ✅ Running
- **MongoDB:** ✅ Connected
- **Email Delivery:** ❌ Need to fix Gmail credentials

**Fix the .env file and Gmail app password, then restart the server!** 🚀
