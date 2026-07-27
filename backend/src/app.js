const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const publicRoutes = require('./routes/publicRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const galleryRoutes = require('./routes/galleryRoutes');
const newsRoutes = require('./routes/newsRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const emailRoutes = require('./routes/emailRoutes');

const app = express();

// Enable Gzip Compression for 100K+ users high performance
app.use(compression());

// Security Headers (Helmet)
app.use(helmet({
  contentSecurityPolicy: false // Disable CSP for API server to avoid blocking static resources
}));

// Media proxy route (unlimited for asset loading)
app.use('/api/media', mediaRoutes);

// Trust first proxy hop (Nginx / hosting reverse proxy)
// Required so express-rate-limit can read the real IP from X-Forwarded-For
app.set('trust proxy', 1);

// Rate Limiting — API Abuse Prevention
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes', errors: ['Rate limit exceeded'] }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 25,
  message: { success: false, message: 'Too many registration or login attempts, please try again after 15 minutes', errors: ['Auth rate limit exceeded'] }
});

app.use('/api', globalLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/login', authLimiter);

// CORS Options for Live Production & Local Dev
const allowedOrigins = [
  'https://bcarbankmitra.com',
  'https://www.bcarbankmitra.com',
  'http://bcarbankmitra.com',
  'http://www.bcarbankmitra.com',
  'http://localhost:4200',
  'http://127.0.0.1:4200'
];

if (process.env.ALLOWED_ORIGINS) {
  process.env.ALLOWED_ORIGINS.split(',').forEach(o => {
    const trimmed = o.trim();
    if (trimmed && !allowedOrigins.includes(trimmed)) {
      allowedOrigins.push(trimmed);
    }
  });
}

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS policy does not allow access from origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '25mb' })); // Support larger base64 file payloads

// Serve uploads statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/member', authRoutes); // Map both auth and member namespaces
app.use('/api/public', publicRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/news', newsRoutes);
app.use('/api', emailRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('BCAR API is running...');
});

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

module.exports = app;
// triggers restart
