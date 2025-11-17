/**
 * Script to create a test user for development
 * Run: node create-test-user.js
 */

const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

// Use the same MongoDB URI from backend .env or use default from database config
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://talezshort_db_user:xPcgBuCOO6WEOUFq@cluster0.nexvefr.mongodb.net/cardtracker_pro';

async function createTestUser() {
  try {
    // Connect to MongoDB
    if (!MONGODB_URI) {
      console.error('❌ Error: MONGODB_URI not found in environment variables');
      console.log('   Please make sure .env file exists in backend directory with MONGODB_URI');
      process.exit(1);
    }
    
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const email = 'codeprabhas21@gmail.com';
    const password = '12345678';
    const name = 'Test User';

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    if (existingUser) {
      console.log('⚠️  User already exists:', email);
      console.log('   Updating password...');
      
      // Update password
      existingUser.password = password; // Will be hashed by pre-save hook
      existingUser.isActive = true;
      await existingUser.save();
      
      console.log('✅ Password updated successfully');
      console.log('   Email:', email);
      console.log('   Password:', password);
      console.log('   Role:', existingUser.role);
    } else {
      // Create new user
      console.log('📝 Creating new user...');
      
      const newUser = new User({
        name: name,
        email: email.toLowerCase(),
        password: password, // Will be hashed by pre-save hook
        role: 'admin', // Set as admin for testing
        isActive: true,
        permissions: [
          'view_cardholders', 'create_cardholders', 'edit_cardholders', 'delete_cardholders',
          'view_bill_payments', 'create_bill_payments', 'process_bill_payments',
          'view_gateways', 'manage_gateways', 'view_reports', 'manage_company',
          'manage_users', 'view_all_data'
        ]
      });

      await newUser.save();
      
      console.log('✅ User created successfully!');
      console.log('   Email:', email);
      console.log('   Password:', password);
      console.log('   Role: admin');
      console.log('   ID:', newUser._id);
    }

    // Verify the user
    const user = await User.findOne({ email: email.toLowerCase() });
    const isPasswordValid = await user.comparePassword(password);
    
    console.log('');
    console.log('🔍 Verification:');
    console.log('   User exists:', !!user);
    console.log('   Password valid:', isPasswordValid);
    console.log('   User active:', user.isActive);
    console.log('   User role:', user.role);

    await mongoose.disconnect();
    console.log('');
    console.log('✅ Done! You can now login with:');
    console.log('   Email:', email);
    console.log('   Password:', password);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the script
createTestUser();

