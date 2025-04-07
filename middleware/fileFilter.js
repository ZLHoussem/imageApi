// middleware/fileFilter.js
const { ALLOWED_MIME_TYPES } = require('../config/config');

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true); // Accept file
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and GIF images are allowed.'), false);
  }
};

module.exports = fileFilter;