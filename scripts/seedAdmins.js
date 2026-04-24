require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../src/models/admin.model');

const seedAdmins = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');

    const admins = [
      {
        name: process.env.ADMIN_SEED_NAME_1,
        email: process.env.ADMIN_SEED_EMAIL_1,
        password: process.env.ADMIN_SEED_PASSWORD_1,
      },
    ].filter((a) => a.name && a.email && a.password);

    if (admins.length === 0) {
      console.log('No admin credentials found in .env — nothing to seed.');
      process.exit(0);
    }

    for (const adminData of admins) {
      const existing = await Admin.findOne({ email: adminData.email });

      if (existing) {
        console.log(`Admin already exists, skipping: ${adminData.email}`);
        continue;
      }

      await Admin.create(adminData);
      console.log(`Admin created: ${adminData.email}`);
    }

    console.log('Seeding complete.');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exit(1);
  }
};

seedAdmins();
