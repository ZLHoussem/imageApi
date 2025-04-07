// image-server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet'); // Corrected: require helmet
const path = require('path');
const fs = require('fs');

// Load configuration
const { PORT, UPLOAD_DIR, UPLOAD_DIRC, CORS_OPTIONS } = require('./config/config'); // Add UPLOAD_DIRC

// Load middleware
const apiLimiter = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

// Load routes
const uploadRoutes = require('./routes/uploadRoutes');

// Create Express app
const app = express();

// --- Ensure Upload Directories Exist ---
function ensureDirExists(dirPath, dirName) {
  if (!fs.existsSync(dirPath)) {
    try {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`Created ${dirName} directory: ${dirPath}`);
    } catch (err) {
      console.error(`Error creating ${dirName} directory ${dirPath}:`, err);
      process.exit(1); // Exit if we can't create essential directories
    }
  }
}
ensureDirExists(UPLOAD_DIR, 'uploads');
ensureDirExists(UPLOAD_DIRC, 'chauffeur_uploads'); // Ensure chouffeur dir exists too


// --- Core Middleware ---
app.use(apiLimiter);
app.use(helmet()); // Corrected: use helmet()
app.use(cors(CORS_OPTIONS));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Static Serving for /image route ---
// Serve BOTH directories under /image. Files need unique names across both!
// If chauffeur images should be under /image/chouffeur/, setup is different.
// Assuming unique names and both served under /image for simplicity matching GET /image/:filename logic
app.use('/image', express.static(UPLOAD_DIR, { maxAge: '1d', etag: true }));
app.use('/image', express.static(UPLOAD_DIRC, { maxAge: '1d', etag: true })); // Serve chouffeur images too


// --- API Routes ---
app.use('/', uploadRoutes); // Mount routes at root


// --- Catch-all for 404 Not Found ---
app.use((req, res, next) => {
  res.status(404).json({ success: false, error: 'Not Found' });
});

// --- Central Error Handler ---
app.use(errorHandler);

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Image server running at http://localhost:${PORT}`);
  console.log(`Upload directory: ${UPLOAD_DIR}`);
  console.log(`Chouffeur Upload directory: ${UPLOAD_DIRC}`);
  console.log(`CORS allows origins: ${JSON.stringify(CORS_OPTIONS.origin)}`);
});