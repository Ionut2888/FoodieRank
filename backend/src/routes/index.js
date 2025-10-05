const express = require('express');
const router = express.Router();
const authRoutes = require('./auth');

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API info route
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to FoodieRank API',
    version: '1.0.0',
    docs: '/api/v1/docs' // for future API documentation
  });
});
// Auth routes
router.use('/auth', authRoutes);

module.exports = router;
