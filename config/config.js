// config/config.js
const path = require('path');
//require('dotenv').config(); // Optional

module.exports = {
  PORT: process.env.PORT || 5000,
  UPLOAD_DIR: path.join(__dirname, '../uploads/'),
  UPLOAD_DIRC: path.join(__dirname, '../uploads/chouffeur/'), // Added if you need the /chouffeur route
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  // IMAGE_QUALITY: 70, // REMOVED - Not optimizing in this version
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/gif'], // Keep for filtering
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000,
  RATE_LIMIT_MAX_REQUESTS: 100,

  // CORS configuration (adjust for production)
  CORS_OPTIONS: {
    origin: '*', // Development: Allow all origins (INSECURE FOR PRODUCTION)
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }
};