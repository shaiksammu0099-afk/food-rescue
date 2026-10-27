/**
 * Food Rescue Platform - Main Backend Application Server
 * Framework: Node.js & Express
 * Database: MySQL 8.0+ (with resilient in-memory mock fallback)
 * AI Integration: Python AI Microservice Bridge
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB, isMySQLConnected } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const donationRoutes = require('./routes/donationRoutes');
const rescueRoutes = require('./routes/rescueRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const aiRoutes = require('./routes/aiRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Root API Welcome & Status
app.get('/', (req, res) => {
  res.json({
    name: 'Food Rescue Platform API',
    version: '1.0.0',
    status: 'ONLINE',
    database_mode: isMySQLConnected() ? 'MySQL (Live)' : 'In-Memory Mock Database (Fallback Active)',
    docs: {
      auth: '/api/auth/login, /api/auth/users',
      donations: '/api/donations, /api/donations/categories',
      rescues: '/api/rescues, /api/rescues/claim',
      analytics: '/api/analytics/impact',
      ai: '/api/ai/predict-shelf-life, /api/ai/smart-match, /api/ai/calculate-impact'
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/rescues', rescueRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `API Route not found: ${req.originalUrl}` });
});

// Global Error Handler
app.use(errorHandler);

// Server Startup
async function startServer() {
  await initDB();
  app.listen(PORT, () => {
    console.log('='.repeat(65));
    console.log(`🍏 FOOD RESCUE BACKEND API RUNNING ON http://localhost:${PORT}`);
    console.log(`📦 Database: ${isMySQLConnected() ? 'MySQL Connected' : 'In-Memory Resilient DB'}`);
    console.log(`🤖 AI Bridge: Active (Python microservice or local AI engine)`);
    console.log('='.repeat(65));
  });
}

startServer();

module.exports = app;
