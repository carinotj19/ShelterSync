/* eslint-disable no-process-exit */
// Load environment variables from .env
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Import configuration and utilities
const config = require('./config/config');
const logger = require('./utils/logger');
const { globalErrorHandler } = require('./middleware/errorHandler');

// Import security middleware
const {
  generalLimiter,
  securityHeaders,
  sanitizeData,
  requestLogger,
  corsOptions,
  mongoSanitize
} = require('./middleware/security');

const app = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(generalLimiter);
app.use(mongoSanitize);
app.use(sanitizeData);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Connect to MongoDB
mongoose.connect(config.mongoose.url, config.mongoose.options)
  .then(() => {
    logger.info('Connected to MongoDB successfully', {
      database: config.mongoose.url.split('/').pop().split('?')[0]
    });
  })
  .catch((error) => {
    logger.error('MongoDB connection failed', { error: error.message });
    process.exit(1);
  });

// MongoDB connection event handlers
mongoose.connection.on('error', (error) => {
  logger.error('MongoDB connection error', { error: error.message });
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully');
  await mongoose.connection.close();
  process.exit(0);
});

// Health check endpoint
app.get('/health', (req, res) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.env,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  };

  res.status(200).json(healthCheck);
});

// API root route
app.get('/', (req, res) => {
  res.json({
    message: 'ShelterSync API is running',
    version: '1.0.0',
    environment: config.env,
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/pets', require('./routes/pets'));
app.use('/api/adopt', require('./routes/adoption'));
app.use('/api/image', require('./routes/images'));

// Serve static files in production
if (config.env === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// Handle 404 for API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handling middleware (must be last)
app.use(globalErrorHandler);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection', { error: err.message, stack: err.stack });
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

// Start the server
const server = app.listen(config.port, () => {
  logger.info('Server started successfully', {
    port: config.port,
    environment: config.env,
    nodeVersion: process.version
  });
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`Port ${config.port} is already in use`);
  } else {
    logger.error('Server error', { error: error.message });
  }
  process.exit(1);
});

module.exports = app;
