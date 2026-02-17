// Seed script to create the first admin user
// Run with: node seedAdmin.js

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('❌ Admin user already exists!');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Username: ${existingAdmin.username}`);
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      username: 'admin',
      email: 'admin@bookclub.com',
      password: 'admin123', // Change this!
      displayName: 'Admin User',
      role: 'admin',
      status: 'approved'
    });

    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('Login credentials:');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: admin123`);
    console.log('');
    console.log('⚠️  IMPORTANT: Change the password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error.message);
    process.exit(1);
  }
};

// Run the seed function
createAdminUser();
