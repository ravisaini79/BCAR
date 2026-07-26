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

// Middleware
app.use(cors());
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
