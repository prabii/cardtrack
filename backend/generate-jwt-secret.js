#!/usr/bin/env node

/**
 * Generate a secure JWT secret for CardTracker Pro
 */

const crypto = require('crypto');

console.log('🔐 Generating Secure JWT Secret');
console.log('================================\n');

// Generate a secure random JWT secret
const jwtSecret = crypto.randomBytes(64).toString('hex');

console.log('✅ Your secure JWT secret:');
console.log('==========================');
console.log(jwtSecret);
console.log('');

console.log('📝 Add this to your .env file:');
console.log('==============================');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log('');

console.log('🔒 Security Notes:');
console.log('==================');
console.log('• This secret is 128 characters long');
console.log('• It\'s cryptographically secure');
console.log('• Keep it secret and never share it');
console.log('• Use different secrets for different environments');
console.log('• Store it securely in production');
console.log('');

console.log('📁 Your .env file should look like:');
console.log('====================================');
console.log('MONGODB_URI=mongodb+srv://talezshort_db_user:xPcgBuCOO6WEOUFq@cluster0.nexvefr.mongodb.net/cardtracker_pro');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log('PORT=3001');
console.log('NODE_ENV=development');
console.log('EMAIL_USER=your-email@gmail.com');
console.log('EMAIL_PASS=your-16-character-app-password');
console.log('');

console.log('🎉 JWT secret generated successfully!');
console.log('Copy the JWT_SECRET line above to your .env file.');
