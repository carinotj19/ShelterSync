// Utility script to insert a single administrator into the database.
//
// The admin credentials are taken from environment variables ADMIN_EMAIL
// and ADMIN_PASSWORD.  If these are not defined the default email
// `admin@sheltersync.com` and password `admin123` are used.  The admin
// will be assigned the `admin` role.  Run this script after configuring
// MONGO_URI in your `.env` file to point to your MongoDB Atlas cluster.

require('dotenv').config();

const mongoose = require('mongoose');
const config = require('../config/config');
const User = require('../models/User');

async function seedAdmin() {
  await mongoose.connect(config.mongoose.url, config.mongoose.options);

  try {
    const email = process.env.ADMIN_EMAIL || 'admin@sheltersync.com';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`Admin user with email ${email} already exists`);
      return;
    }
    await User.create({
      name: 'Administrator',
      email,
      password,
      role: 'admin',
      location: 'HQ'
    });
    console.log(`Admin user created: ${email}`);
  } catch (err) {
    console.error('Error creating admin user:', err);
    throw err;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedAdmin().catch(() => process.exit(1));