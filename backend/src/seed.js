const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const Gallery = require('./models/Gallery');
const News = require('./models/News');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    console.log('Connecting to database for seeding...');
    await mongoose.connect(mongoUri);
    console.log('Database connected.');

    // 1. Seed Gallery
    const galleryCount = await Gallery.countDocuments({ isDeleted: false });
    if (galleryCount === 0) {
      console.log('Seeding Gallery collection...');
      await Gallery.create([
        {
          title: 'Financial Inclusion Desk Operations',
          category: 'inclusion',
          description: 'A rural business correspondent agent assisting local villagers with cash withdrawals and digital deposits using micro-ATMs.',
          image: {
            public_id: 'bcar/gallery/seed_inclusion',
            secure_url: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=1200&auto=format&fit=crop',
            width: 1200,
            height: 800,
            format: 'jpg',
            bytes: 145000
          },
          displayOrder: 1,
          status: 'Published',
          featured: true
        },
        {
          title: 'State Committee Assembly 2026',
          category: 'meeting',
          description: 'Members of the BCAR Rajasthan State Committee discussing regulatory guidelines and commission structures in Jaipur.',
          image: {
            public_id: 'bcar/gallery/seed_meeting',
            secure_url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=1200&auto=format&fit=crop',
            width: 1200,
            height: 800,
            format: 'jpg',
            bytes: 168000
          },
          displayOrder: 2,
          status: 'Published',
          featured: true
        },
        {
          title: 'IIBF Certification Training Program',
          category: 'training',
          description: 'A professional training seminar hosted by BCAR to train and certify agents on advanced micro-finance practices.',
          image: {
            public_id: 'bcar/gallery/seed_training',
            secure_url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=1200&auto=format&fit=crop',
            width: 1200,
            height: 800,
            format: 'jpg',
            bytes: 135000
          },
          displayOrder: 3,
          status: 'Published',
          featured: false
        }
      ]);
      console.log('Gallery seeded.');
    } else {
      console.log('Gallery already has records. Skipping.');
    }

    // 2. Seed News
    const newsCount = await News.countDocuments({ isDeleted: false });
    if (newsCount === 0) {
      console.log('Seeding News collection...');
      await News.create([
        {
          title: 'State-wide Digital Banking Promotion Drive 2026',
          slug: 'state-wide-digital-banking-promotion-drive-2026',
          shortDescription: 'BCAR announces Rajasthan-wide promotional drive for micro-ATMs and financial inclusion desks.',
          fullDescription: '<h2>State-wide Digital Banking Promotion</h2><p>Rajasthan\'s Business Correspondent Association is launching an extensive promotional program across rural districts. The drive focuses on onboarding senior citizens and rural students to digital micro-ATM services.</p><p>We request all active members to update their CSP details and sync operational reports with the district nodal coordinators.</p><p>This initiative aims to cover over 500 new villages in the next quarter.</p>',
          featuredImage: {
            public_id: 'bcar/news/seed_news1',
            secure_url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=1200&auto=format&fit=crop',
            width: 1200,
            height: 630,
            format: 'jpg',
            bytes: 110000
          },
          category: 'circular',
          status: 'Published',
          featured: true,
          pinned: true
        },
        {
          title: 'New NABARD Financial Inclusion Subsidies Released',
          slug: 'new-nabard-financial-inclusion-subsidies-released',
          shortDescription: 'New subsidy guidelines released by NABARD for rural Business Correspondents operating in Rajasthan.',
          fullDescription: '<h2>NABARD Subsidies and Grants Guidelines</h2><p>A new circular issued by NABARD outlines financial grants for hardware upgrades including biometric scanners, thermal printers, and solar backups.</p><p>Eligible CSPs can apply directly via the BCAR portal. Details on minimum transactions and criteria are attached below.</p><p>Make sure to review the application deadline of July 31, 2026.</p>',
          featuredImage: {
            public_id: 'bcar/news/seed_news2',
            secure_url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1200&auto=format&fit=crop',
            width: 1200,
            height: 630,
            format: 'jpg',
            bytes: 125000
          },
          category: 'policy',
          status: 'Published',
          featured: false,
          pinned: false
        },
        {
          title: 'Annual State Level BC Leadership Conference in Jaipur',
          slug: 'annual-state-level-bc-leadership-conference-in-jaipur',
          shortDescription: 'Announcing the annual BCAR Leadership Summit 2026 in Jaipur on August 15.',
          fullDescription: '<h2>Annual Leadership Conference 2026</h2><p>We are excited to invite all members, coordinators, and bank representatives to the annual summit at Birla Auditorium, Jaipur.</p><p>Topics of discussion include blockchain applications in micro-remittances, safety protocols, and commission negotiation strategies.</p><p>Registration is free for all certified BCAR members.</p>',
          featuredImage: {
            public_id: 'bcar/news/seed_news3',
            secure_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop',
            width: 1200,
            height: 630,
            format: 'jpg',
            bytes: 140000
          },
          category: 'event',
          status: 'Published',
          featured: true,
          pinned: false
        }
      ]);
      console.log('News seeded.');
    } else {
      console.log('News already has records. Skipping.');
    }

    console.log('Seeding completed successfully.');
    await mongoose.connection.close();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
