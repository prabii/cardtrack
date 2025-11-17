const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/database');

require('dotenv').config();

async function fixOperatorReports() {
  try {
    await connectDB();
    console.log('📝 Fixing operator reports access...');

    const operatorEmail = 'operator@codershive.com';
    const operator = await User.findOne({ email: operatorEmail });

    if (!operator) {
      console.log('❌ Operator user not found');
      return;
    }

    console.log('📋 Current operator details:');
    console.log(`  Role: ${operator.role}`);
    console.log(`  Permissions: ${JSON.stringify(operator.permissions)}`);
    console.log(`  Accessible Modules: ${JSON.stringify(operator.getAccessibleModules())}`);

    // Check if reports is in accessible modules
    const accessibleModules = operator.getAccessibleModules();
    if (!accessibleModules.includes('reports')) {
      console.log('⚠️ Reports module not accessible. This should not happen based on code.');
      console.log('   The getAccessibleModules() method should return reports for operators.');
    } else {
      console.log('✅ Reports module is accessible');
    }

    // Ensure permissions are correct
    const requiredPermissions = [
      'view_cardholders', 'edit_cardholders',
      'view_bill_payments', 'process_bill_payments',
      'view_transactions', 'verify_transactions',
      'view_gateways',
      'view_reports', 'manage_alerts'
    ];

    // Update permissions if needed
    const currentPermissionsSet = new Set(operator.permissions);
    const requiredPermissionsSet = new Set(requiredPermissions);
    const missingPermissions = requiredPermissions.filter(p => !currentPermissionsSet.has(p));

    if (missingPermissions.length > 0) {
      console.log(`⚠️ Missing permissions: ${missingPermissions.join(', ')}`);
      operator.permissions = requiredPermissions;
      await operator.save();
      console.log('✅ Updated operator permissions');
    } else {
      console.log('✅ All required permissions are present');
    }

    // Verify again
    const updatedModules = operator.getAccessibleModules();
    console.log('\n📋 Updated accessible modules:');
    console.log(`  ${updatedModules.join(', ')}`);

    if (updatedModules.includes('reports')) {
      console.log('\n✅ Operator should now have access to reports');
    } else {
      console.log('\n❌ Reports still not accessible. Check getAccessibleModules() method.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n✅ Done!');
  }
}

fixOperatorReports();

