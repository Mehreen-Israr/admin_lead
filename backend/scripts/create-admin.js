const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const User = require('../models/User');

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🔗 Connected to MongoDB');

    // Remove any existing admin users to start fresh
    const existingAdmins = await User.find({ role: 'admin' });
    if (existingAdmins.length > 0) {
      await User.deleteMany({ role: 'admin' });
      console.log(`🗑️  Removed ${existingAdmins.length} existing admin user(s)`);
    }

    // Create new admin user with plain password (will be hashed by pre-save hook)
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123', // This will be automatically hashed by the pre-save hook
      role: 'admin',
      isActive: true
    });

    await adminUser.save();
    
    console.log('\n✅ Admin user created successfully!');
    console.log('📧 Email: admin@example.com');
    console.log('🔑 Password: admin123');
    console.log('👤 Role: admin');
    console.log('\n🚀 You can now log in to the admin panel!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    if (error.code === 11000) {
      console.error('💡 Tip: An admin with this email already exists');
    }
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the script
createAdmin();