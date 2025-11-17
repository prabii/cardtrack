const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cardtracker', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

async function fixOperatorUser() {
  try {
    await connectDB();
    
    const operatorEmail = 'operator@codershive.com';
    const operatorPassword = 'Operator@12345';
    
    // Check if operator exists
    let operator = await User.findOne({ email: operatorEmail });
    
    if (!operator) {
      console.log('📝 Creating operator user...');
      
      // Get default permissions for operator
      const getDefaultPermissions = (userRole) => {
        const permissions = {
          operator: [
            'view_cardholders', 'edit_cardholders',
            'view_bill_payments', 'process_bill_payments',
            'view_transactions', 'verify_transactions',
            'view_gateways',
            'view_reports', 'manage_alerts'
          ]
        };
        return permissions[userRole] || [];
      };
      
      operator = new User({
        name: 'Oscar Operator',
        email: operatorEmail,
        password: operatorPassword,
        role: 'operator',
        permissions: getDefaultPermissions('operator'),
        isActive: true
      });
      
      await operator.save();
      console.log('✅ Operator user created successfully');
    } else {
      console.log('📝 Operator user exists, updating...');
      
      // Update password (will be hashed automatically)
      operator.password = operatorPassword;
      operator.isActive = true;
      operator.role = 'operator';
      
      // Update permissions
      const getDefaultPermissions = (userRole) => {
        const permissions = {
          operator: [
            'view_cardholders', 'edit_cardholders',
            'view_bill_payments', 'process_bill_payments',
            'view_transactions', 'verify_transactions',
            'view_gateways',
            'view_reports', 'manage_alerts'
          ]
        };
        return permissions[userRole] || [];
      };
      operator.permissions = getDefaultPermissions('operator');
      
      await operator.save();
      console.log('✅ Operator user updated successfully');
    }
    
    // Verify the user
    const verifyUser = await User.findOne({ email: operatorEmail });
    console.log('\n📋 Operator User Details:');
    console.log('  Email:', verifyUser.email);
    console.log('  Name:', verifyUser.name);
    console.log('  Role:', verifyUser.role);
    console.log('  Active:', verifyUser.isActive);
    console.log('  Permissions:', verifyUser.permissions);
    
    // Test password
    const passwordTest = await verifyUser.comparePassword(operatorPassword);
    console.log('  Password Test:', passwordTest ? '✅ Valid' : '❌ Invalid');
    
    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixOperatorUser();

