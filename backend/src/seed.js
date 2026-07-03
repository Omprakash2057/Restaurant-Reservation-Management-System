// Seeds the database with a fixed set of tables and demo users.
// Run with: npm run seed
require('dotenv').config();
const connectDB = require('./config/db');
const Table = require('./models/Table');
const User = require('./models/User');
const mongoose = require('mongoose');

const tables = [
  { tableNumber: 1, capacity: 2 },
  { tableNumber: 2, capacity: 2 },
  { tableNumber: 3, capacity: 4 },
  { tableNumber: 4, capacity: 4 },
  { tableNumber: 5, capacity: 6 },
  { tableNumber: 6, capacity: 8 },
];

const demoUsers = [
  { name: 'Admin User', email: 'admin@restaurant.com', password: 'admin123', role: 'admin' },
  { name: 'Demo Customer', email: 'customer@example.com', password: 'customer123', role: 'customer' },
];

const seed = async () => {
  await connectDB();

  try {
    await Table.deleteMany({});
    await Table.insertMany(tables);
    console.log(`Seeded ${tables.length} tables`);

    for (const userData of demoUsers) {
      const exists = await User.findOne({ email: userData.email });
      if (!exists) {
        await User.create(userData);
        console.log(`Created demo user: ${userData.email} (${userData.role})`);
      } else {
        console.log(`User already exists, skipping: ${userData.email}`);
      }
    }

    console.log('Seeding complete.');
  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

seed();
