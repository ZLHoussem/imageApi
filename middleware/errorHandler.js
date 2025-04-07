// middleware/errorHandler.js
const multer = require('multer');
const { MAX_FILE_SIZE } = require('../config/config');

const errorHandler = (err, req, res, next) => {
  console.error("ERROR Caught by Handler:", err.message);

  // Handle Multer-specific errors
  if (err instanceof multer.MulterError) {
    let message = 'File upload error.';
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.`;
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Unexpected file field. Ensure the field name is correct.';
    }
    return res.status(400).json({ success: false, error: message, code: err.code });
  }

  // Handle file filter errors
  if (err.message.startsWith('Invalid file type')) {
    return res.status(400).json({ success: false, error: err.message });
  }

  // REMOVED: Optimization error check is no longer needed here
  // if (err.message === 'Image optimization failed.') { ... }

  // Log the full stack trace for other server errors
  if (!(err instanceof multer.MulterError) && !err.message.startsWith('Invalid file type')) {
      console.error(err.stack);
  }

  // Default generic error response
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
};

module.exports = errorHandler;