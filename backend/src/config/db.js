const mongoose = require('mongoose');

const seedAdminUser = async () => {
  try {
    const User = require('../models/User');
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@bcarajasthan.org';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

    const adminExists = await User.findOne({ email: adminEmail });
    if (!adminExists) {
      await User.create({
        name: 'Super Admin',
        email: adminEmail,
        phone: '0000000000',
        password: adminPassword,
        role: 'super_admin',
        status: 'active',
        declarationAccepted: true
      });
      console.log(`Admin user successfully seeded: ${adminEmail} / ${adminPassword}`);
    } else {
      console.log(`Admin user already exists: ${adminEmail}`);
    }
  } catch (error) {
    console.error(`Error seeding admin user: ${error.message}`);
  }
};

const seedNotices = async () => {
  try {
    const Notice = require('../models/Notice');
    const count = await Notice.countDocuments({});
    if (count === 0) {
      await Notice.create([
        {
          title: 'BCAR Portal Redesign Launched',
          body: 'Welcome to the official redesigned website of BCAR Rajasthan. Bank Mitras can now register online, view latest notices, and raise grievances directly in the member portal.',
          category: 'General'
        },
        {
          title: 'State Committee Assembly in Jaipur',
          body: 'The state executive committee will hold a general assembly on July 10th at 11 AM in the Jaipur main office. Agenda includes commission negotiations and welfare policy reviews.',
          category: 'Meeting'
        },
        {
          title: 'New Life Insurance Cover for Members',
          body: 'BCAR has successfully negotiated a Group Term Life Insurance policy for all registered and verified members at discount rates. Check the document section in your dashboard.',
          category: 'Official'
        }
      ]);
      console.log('Sample notices successfully seeded.');
    }
  } catch (error) {
    console.error(`Error seeding notices: ${error.message}`);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bcar');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await seedAdminUser();
    await seedNotices();
  } catch (error) {
    console.error(`MongoDB local connection failed: ${error.message}`);
    console.log('Attempting to start in-memory MongoDB database...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create({
        binary: {
          version: '5.0.22'
        }
      });
      const mongoUri = mongoServer.getUri();
      const conn = await mongoose.connect(mongoUri);
      console.log(`In-memory MongoDB Connected: ${conn.connection.host}`);
      await seedAdminUser();
      await seedNotices();
    } catch (memError) {
      console.error(`Failed to start in-memory MongoDB: ${memError.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
