const mongoose = require('mongoose');
const Gateway = require('./models/Gateway');
const connectDB = require('./config/database');

require('dotenv').config();

async function seedGateways() {
  try {
    await connectDB();
    console.log('📝 Seeding gateways...');

    const defaults = [
      { name: 'PayPoint', description: 'PayPoint Payment Gateway' },
      { name: 'InstantMudra', description: 'InstantMudra Payment Gateway' }
    ];

    for (const gateway of defaults) {
      const existing = await Gateway.findOne({ name: gateway.name });
      if (!existing) {
        const newGateway = new Gateway({
          ...gateway,
          isActive: true
        });
        await newGateway.save();
        console.log(`✅ Seeded gateway: ${gateway.name}`);
      } else {
        // Ensure gateway is active
        if (!existing.isActive) {
          existing.isActive = true;
          await existing.save();
          console.log(`🔄 Activated gateway: ${gateway.name}`);
        } else {
          console.log(`✓ Gateway already exists: ${gateway.name}`);
        }
      }
    }

    // List all gateways
    const allGateways = await Gateway.find();
    console.log('\n📋 Current gateways in database:');
    allGateways.forEach(g => {
      console.log(`  - ${g.name} (${g.isActive ? 'Active' : 'Inactive'}) - ID: ${g._id}`);
    });

  } catch (error) {
    console.error('❌ Error seeding gateways:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n✅ Done!');
  }
}

seedGateways();

