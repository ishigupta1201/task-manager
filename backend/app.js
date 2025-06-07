// backend/app.js - Main Express Application Setup
console.log('App.js: Starting App module setup...'); // Add this

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

console.log('App.js: Core modules imported.'); // Add this

// Import database connection function
const connectDB = require('./config/db');

console.log('App.js: connectDB module imported.'); // Add this

// Import routes
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

console.log('App.js: All route modules imported.'); // Add this

// Import middleware
const authMiddleware = require('./middleware/auth'); // Assuming your auth middleware is auth.js
const errorHandler = require('./middleware/errorHandler');

console.log('App.js: All middleware modules imported.'); // Add this

const app = express();

console.log('App.js: Express app initialized.'); // Add this

// Database Connection - Call the function to connect to MongoDB
connectDB(); // This will connect when app.js is imported/run

console.log('App.js: Database connection initiated.'); // Add this

// Security middleware
app.use(helmet());
console.log('App.js: Helmet middleware applied.'); // Add this

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
console.log('App.js: CORS middleware applied.'); // Add this

// Rate limiting middleware
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);
console.log('App.js: Rate limiting middleware applied.'); // Add this

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
console.log('App.js: Body parsing middleware applied.'); // Add this

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log('App.js: Static files for uploads configured.'); // Add this

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
console.log('App.js: API routes mounted.'); // Add this

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});
console.log('App.js: Health check route defined.'); // Add this

// Error handling middleware
app.use(errorHandler);
console.log('App.js: Error handling middleware applied.'); // Add this

console.log('App.js: End of App module setup.'); // Add this

module.exports = app;