# Email Setup for OTP Functionality

## Gmail Configuration

To enable real email sending for OTP functionality, you need to set up Gmail App Password.

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Navigate to Security
3. Enable 2-Factor Authentication

### Step 2: Generate App Password
1. Go to Google Account settings
2. Navigate to Security > 2-Step Verification
3. Scroll down to "App passwords"
4. Generate a new app password for "Mail"
5. Copy the 16-character password

### Step 3: Create .env file
Create a `.env` file in the backend directory with:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://talezshort_db_user:xPcgBuCOO6WEOUFq@cluster0.nexvefr.mongodb.net/cardtracker_pro

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production-12345
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:4028

# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password
```

### Step 4: Install Dependencies
```bash
cd backend
npm install
```

### Step 5: Start Server
```bash
npm run dev
```

## How It Works

1. User enters email on reset-password page
2. Backend generates 6-digit OTP
3. OTP is sent to user's Gmail inbox
4. User enters OTP to verify
5. User can reset password

## Fallback

If email sending fails, the OTP will still be returned in the API response for testing purposes.

## Testing

1. Use a real Gmail address
2. Check your inbox for the OTP email
3. The email will have a beautiful HTML template with the OTP code
