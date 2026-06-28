const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Gallery = require('./models/Gallery');
const News = require('./models/News');

const publishAll = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    await mongoose.connect(mongoUri);
    console.log('Database connected.');

    // Publish all Gallery items
    const galleryResult = await Gallery.updateMany(
      { status: 'Draft' },
      { $set: { status: 'Published' } }
    );
    console.log(`Updated ${galleryResult.modifiedCount} Gallery items to Published.`);

    // Publish all News items
    const newsResult = await News.updateMany(
      { status: 'Draft' },
      { $set: { status: 'Published' } }
    );
    console.log(`Updated ${newsResult.modifiedCount} News articles to Published.`);

    await mongoose.connection.close();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error updating records:', error);
    process.exit(1);
  }
};

publishAll();
