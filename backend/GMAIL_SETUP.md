# 📧 Gmail Setup for OTP Emails

## **Quick Setup (5 Minutes)**

### **Step 1: Enable 2-Factor Authentication**
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Click **Security** (left sidebar)
3. Under **"Signing in to Google"**, click **2-Step Verification**
4. Follow the setup process to enable 2FA

### **Step 2: Generate App Password**
1. Go back to **Security** → **2-Step Verification**
2. Scroll down to **"App passwords"**
3. Click **"App passwords"**
4. Select **"Mail"** from dropdown
5. Click **"Generate"**
6. **Copy the 16-character password** (looks like: `abcd efgh ijkl mnop`)

### **Step 3: Create .env File**
Create a `.env` file in the `backend` directory:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://talezshort_db_user:xPcgBuCOO6WEOUFq@cluster0.nexvefr.mongodb.net/cardtracker_pro

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production-12345

# Server Configuration
PORT=3001
NODE_ENV=development

# Gmail Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password
```

### **Step 4: Install Dependencies**
```bash
cd backend
npm install
```

### **Step 5: Start Server**
```bash
npm run dev
```

---

## **🧪 Test the Setup**

1. **Go to:** `http://localhost:4028/reset-password`
2. **Enter your Gmail address**
3. **Check your Gmail inbox** for the OTP email
4. **Enter the OTP** to reset password

---

## **📧 What You'll Get**

### **Email Features:**
- **From:** Your Gmail address
- **Subject:** "CardTracker Pro - Password Reset OTP"
- **Design:** Beautiful HTML template with gradients
- **OTP:** Large, easy-to-read 6-digit code
- **Security:** Clear instructions and expiry time

### **Email Template:**
```
┌─────────────────────────────────────┐
│  CardTracker Pro                    │
│  Password Reset Verification        │
├─────────────────────────────────────┤
│  Password Reset Request             │
│                                     │
│  Your Verification Code:            │
│  ┌─────────────────────────────────┐ │
│  │           123456                │ │
│  └─────────────────────────────────┘ │
│                                     │
│  Important:                         │
│  • Expires in 5 minutes            │
│  • Don't share with anyone         │
│  • Ignore if you didn't request    │
└─────────────────────────────────────┘
```

---

## **🔧 Troubleshooting**

### **"Invalid credentials" Error:**
- Make sure you're using the **16-character app password**, not your regular Gmail password
- Ensure 2FA is enabled on your Google account
- Check that the app password is for "Mail" service

### **"Less secure app access" Error:**
- This shouldn't happen with app passwords
- Make sure you're using app password, not regular password

### **Email Not Received:**
- Check spam/junk folder
- Verify email address is correct
- Check Gmail account is active
- Wait a few minutes (sometimes delayed)

### **Server Won't Start:**
- Check .env file exists in backend directory
- Verify all required variables are set
- Make sure no extra spaces in .env file
- Check MongoDB connection

---

## **✅ Benefits of Gmail Setup**

- **Free** - No cost for sending emails
- **Reliable** - Google's infrastructure
- **Familiar** - Uses your existing Gmail
- **Secure** - App passwords are safer than regular passwords
- **Unlimited** - No daily sending limits (within reason)
- **Professional** - Emails come from your Gmail address

---

## **🚀 Production Ready**

This Gmail setup is perfect for:
- **Personal projects**
- **Small businesses**
- **Startups**
- **Testing and development**
- **Production applications**

**Your OTP emails will now be sent via Gmail with beautiful templates!** 🎉📧
