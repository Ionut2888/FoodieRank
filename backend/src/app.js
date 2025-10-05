const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');
const { helmet, rateLimiter, corsOptions } = require('./middleware/security');
const routes = require('./routes');

const app = express();

// Security middleware
app.use(helmet);
app.use(rateLimiter);

// CORS
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: message => logger.info(message.trim()) }
  }));
}

// Root route handler
app.get('/', (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    // Minimal response for production
    res.status(200).json({
      success: true,
      message: 'API Server is running',
      status: 'healthy'
    });
  } else {
    // Detailed response for development
    res.status(200).json({
      success: true,
      message: 'Welcome to FoodieRank API Server',
      version: '1.0.0',
      endpoints: {
        api: '/api/v1',
        health: '/api/v1/health'
      },
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });
  }
});

// Routes
app.use('/api/v1', routes);

// 404 handler - catch all unmatched routes
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`,
    method: req.method
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;
