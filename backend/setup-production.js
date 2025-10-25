#!/usr/bin/env node

/**
 * Production Setup Script for CardTracker Pro
 * This script helps you set up production email service
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 CardTracker Pro - Production Setup');
console.log('=====================================\n');

// Check if .env exists
const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);

if (!envExists) {
  console.log('📝 Creating .env file...');
  
  const envContent = `# Production Environment Configuration
NODE_ENV=production

# MongoDB Configuration
MONGODB_URI=mongodb+srv://talezshort_db_user:xPcgBuCOO6WEOUFq@cluster0.nexvefr.mongodb.net/cardtracker_pro

# JWT Configuration (CHANGE THIS IN PRODUCTION!)
JWT_SECRET=your-super-secure-production-jwt-secret-key-change-this-12345
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
PORT=3001

# CORS Configuration
FRONTEND_URL=https://yourdomain.com

# SendGrid Email Configuration (Production)
SENDGRID_API_KEY=your-sendgrid-api-key-here
EMAIL_FROM=noreply@yourdomain.com

# Alternative Email Services (uncomment to use)
# Gmail with App Password
# EMAIL_USER=your-email@gmail.com
# EMAIL_PASS=your-16-character-app-password

# Gmail with OAuth2
# GOOGLE_CLIENT_ID=your-google-client-id
# GOOGLE_CLIENT_SECRET=your-google-client-secret
# GOOGLE_REDIRECT_URI=your-redirect-uri
# GOOGLE_REFRESH_TOKEN=your-refresh-token

# Mailgun
# MAILGUN_API_KEY=your-mailgun-api-key
# MAILGUN_DOMAIN=your-mailgun-domain
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

console.log('\n📧 Email Service Setup:');
console.log('======================');
console.log('1. SendGrid (Recommended):');
console.log('   - Sign up at https://sendgrid.com/');
console.log('   - Get API key from Settings → API Keys');
console.log('   - Verify sender identity');
console.log('   - Add SENDGRID_API_KEY to .env file');
console.log('');

console.log('2. Gmail with App Password:');
console.log('   - Enable 2FA on Gmail');
console.log('   - Generate app password');
console.log('   - Add EMAIL_USER and EMAIL_PASS to .env');
console.log('   - Switch to emailService.js in auth.js');
console.log('');

console.log('3. Mailgun:');
console.log('   - Sign up at https://www.mailgun.com/');
console.log('   - Get API key and domain');
console.log('   - Add MAILGUN_API_KEY and MAILGUN_DOMAIN to .env');
console.log('   - Switch to emailServiceMailgun.js in auth.js');
console.log('');

console.log('🔧 Next Steps:');
console.log('==============');
console.log('1. Choose your email service');
console.log('2. Update .env file with your credentials');
console.log('3. Run: npm install');
console.log('4. Run: npm run dev');
console.log('5. Test OTP at /reset-password');
console.log('');

console.log('📚 Documentation:');
console.log('=================');
console.log('- Production Setup: ./PRODUCTION_SETUP.md');
console.log('- Email Alternatives: ./EMAIL_ALTERNATIVES.md');
console.log('- Email Setup: ./EMAIL_SETUP.md');
console.log('');

console.log('🎉 Setup complete! Your OTP emails will be sent via production email service.');
