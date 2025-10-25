# Email Service Alternatives for OTP

## 🚀 **Quick Start (Console Testing)**

**Currently Active:** Console-based email service for immediate testing.

The OTP will be displayed in the backend console when you request a password reset.

### To Test:
1. Start the backend server
2. Go to `/reset-password` page
3. Enter any email address
4. Check the backend console for the OTP code

---

## 📧 **Email Service Options**

### **Option 1: Gmail with App Password (Easiest)**
```bash
# Install dependencies
npm install nodemailer

# Create .env file with:
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password
```

**Setup Steps:**
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Security → 2-Step Verification → App passwords
3. Generate password for "Mail"
4. Use the 16-character password in .env

**Switch to this service:**
```javascript
// In backend/routes/auth.js, change line 10 to:
const { sendOTPEmail } = require('../services/emailService');
```

---

### **Option 2: Gmail with OAuth2 (Most Secure)**
```bash
# Install dependencies
npm install googleapis

# Create .env file with:
EMAIL_USER=your-email@gmail.com
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=your-redirect-uri
GOOGLE_REFRESH_TOKEN=your-refresh-token
```

**Setup Steps:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Gmail API
4. Create OAuth2 credentials
5. Generate refresh token

**Switch to this service:**
```javascript
// In backend/routes/auth.js, change line 10 to:
const { sendOTPEmail } = require('../services/emailServiceOAuth');
```

---

### **Option 3: SendGrid (Third-party Service)**
```bash
# Install dependencies
npm install @sendgrid/mail

# Create .env file with:
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com
```

**Setup Steps:**
1. Sign up at [SendGrid](https://sendgrid.com/)
2. Get API key from dashboard
3. Verify sender identity

**Switch to this service:**
```javascript
// In backend/routes/auth.js, change line 10 to:
const { sendOTPEmail } = require('../services/emailServiceSendGrid');
```

---

### **Option 4: Mailgun (Another Third-party Service)**
```bash
# Install dependencies
npm install mailgun.js form-data

# Create .env file with:
MAILGUN_API_KEY=your-mailgun-api-key
MAILGUN_DOMAIN=your-mailgun-domain
EMAIL_FROM=noreply@yourdomain.com
```

**Setup Steps:**
1. Sign up at [Mailgun](https://www.mailgun.com/)
2. Get API key and domain from dashboard
3. Verify domain

**Switch to this service:**
```javascript
// In backend/routes/auth.js, change line 10 to:
const { sendOTPEmail } = require('../services/emailServiceMailgun');
```

---

## 🔄 **How to Switch Services**

1. **Open** `backend/routes/auth.js`
2. **Find line 10** with the email service import
3. **Comment out** the current service
4. **Uncomment** the service you want to use
5. **Restart** the backend server

Example:
```javascript
// Comment out current service
// const { sendOTPEmail } = require('../services/emailServiceConsole');

// Uncomment desired service
const { sendOTPEmail } = require('../services/emailService');
```

---

## 🧪 **Testing**

1. **Start backend server:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Test OTP flow:**
   - Go to `/reset-password`
   - Enter email address
   - Check console/email for OTP

3. **Verify OTP:**
   - Enter the OTP code
   - Reset password

---

## 💡 **Recommendations**

- **For Development:** Use Console service (current)
- **For Production:** Use SendGrid or Mailgun
- **For Personal Use:** Use Gmail with App Password
- **For Enterprise:** Use Gmail with OAuth2

---

## 🆘 **Troubleshooting**

### Console Service Not Working:
- Check if backend server is running
- Look for OTP in console output

### Gmail App Password Not Working:
- Ensure 2FA is enabled
- Use 16-character app password (not regular password)
- Check .env file format

### Third-party Services Not Working:
- Verify API keys are correct
- Check service quotas/limits
- Ensure sender email is verified
