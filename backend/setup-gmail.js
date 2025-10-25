#!/usr/bin/env node

/**
 * Gmail Setup Script for CardTracker Pro
 * Simple setup for Gmail with 16-character app password
 */

const fs = require('fs');
const path = require('path');

console.log('📧 Gmail Setup for CardTracker Pro');
console.log('===================================\n');

// Check if .env exists
const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);

if (!envExists) {
  console.log('📝 Creating .env file for Gmail...');
  
  const envContent = `# Gmail Configuration for CardTracker Pro
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb+srv://talezshort_db_user:xPcgBuCOO6WEOUFq@cluster0.nexvefr.mongodb.net/cardtracker_pro

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production-12345
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
PORT=3001

# CORS Configuration
FRONTEND_URL=http://localhost:4028

# Gmail Configuration (REQUIRED)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password
`;

  try {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file created successfully!');
  } catch (error) {
    console.error('❌ Error creating .env file:', error.message);
    console.log('\n📝 Please create .env file manually with the content above.');
  }
} else {
  console.log('✅ .env file already exists');
}

console.log('\n🔐 Gmail App Password Setup:');
console.log('============================');
console.log('1. Go to: https://myaccount.google.com/');
console.log('2. Click "Security" (left sidebar)');
console.log('3. Click "2-Step Verification"');
console.log('4. Scroll down to "App passwords"');
console.log('5. Select "Mail" and click "Generate"');
console.log('6. Copy the 16-character password');
console.log('');

console.log('📝 Update .env file:');
console.log('====================');
console.log('1. Replace "your-email@gmail.com" with your Gmail address');
console.log('2. Replace "your-16-character-app-password" with the app password');
console.log('3. Save the file');
console.log('');

console.log('🚀 Start the server:');
console.log('====================');
console.log('1. Run: npm install');
console.log('2. Run: npm run dev');
console.log('3. Go to: http://localhost:4028/reset-password');
console.log('4. Enter your Gmail address');
console.log('5. Check your inbox for the OTP email!');
console.log('');

console.log('📧 What you\'ll get:');
console.log('===================');
console.log('• Beautiful HTML email template');
console.log('• CardTracker Pro branding');
console.log('• 6-digit OTP code');
console.log('• Security instructions');
console.log('• Professional design');
console.log('');

console.log('✅ Gmail setup complete! Your OTP emails will be sent via Gmail.');
console.log('📚 For detailed instructions, see: GMAIL_SETUP.md');
