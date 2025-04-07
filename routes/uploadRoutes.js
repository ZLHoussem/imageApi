// routes/uploadRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises; // Keep fs for checking file existence in /image route
const { v4: uuidv4 } = require('uuid'); // Use uuid for unique names

// Correctly require config values needed here
const { UPLOAD_DIR, UPLOAD_DIRC, MAX_FILE_SIZE } = require('../config/config');
const fileFilter = require('../middleware/fileFilter');
// REMOVED: const { optimizeImage } = require('../utils/imageProcessor');

const router = express.Router();

// --- Multer Configuration ---

// Storage for regular uploads (/upload)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR); // Use UPLOAD_DIR from config
  },
  filename: (req, file, cb) => {
    // Using UUID for more uniqueness than the original example
    const uniqueFilename = uuidv4();
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uniqueFilename}${ext}`);
  },
});

// Storage for chouffeur uploads (/chouffeur) - If needed
const storagec = multer.diskStorage({
    destination: (req, file, cb) => {
      // Ensure UPLOAD_DIRC exists if using this route
       if (!fs.existsSync(UPLOAD_DIRC)) {
          fs.mkdirSync(UPLOAD_DIRC, { recursive: true });
       }
       cb(null, UPLOAD_DIRC);
    },
    filename: (req, file, cb) => {
      const uniqueFilename = uuidv4();
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `chauffeur_${uniqueFilename}${ext}`); // Add prefix maybe
    },
});


// Multer instance for regular uploads
const upload = multer({
  storage: storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: fileFilter,
});

// Multer instance for chouffeur uploads - If needed
const chouffeurUpload = multer({
    storage: storagec,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: fileFilter,
});


// --- Routes ---

// POST /upload - Adapted to match simpler server behavior
// REMOVED `async` as optimizeImage is not awaited
router.post('/upload', upload.single('image'), (req, res, next) => { // Use next for error handling
  try {
    if (!req.file) {
      // This case should ideally be caught by Multer error handling,
      // but check just in case.
      return res.status(400).json({ success: false, error: 'No image file uploaded.' });
    }

    // --- NO OPTIMIZATION ---
    // The file is already saved by multer's diskStorage

    const filename = req.file.filename; // Get filename saved by multer

    // Construct the URL exactly as the simpler server did (pointing to /uploads/)
    // NOTE: This URL path is likely *not* served directly by default in image-server.js.
    // The client needs to use the /image/:filename route to *view* the image.
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${filename}`;

    // Return the JSON structure matching the simpler server
    res.status(200).json({ // Use 200 OK like the original example
      success: true,
      url: imageUrl, // The potentially misleading URL
      filename: filename, // The actual filename
    });

  } catch (error) {
    // Catch any unexpected errors during URL construction or accessing req.file
    console.error('Unexpected error in /upload route:', error);
    next(error); // Pass to the central error handler
  }
});

// POST /chouffeur - Add this route if you need it, mimicking the simpler server
router.post('/chouffeur', chouffeurUpload.single('image'), (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No image uploaded for chouffeur.' });
        }
        const filename = req.file.filename;
        // Construct URL pointing to a potential /uploads/chouffeur/ path
        // Again, serving might need specific setup or use the /image route.
        const imageUrl = `${req.protocol}://${req.get('host')}/uploads/chouffeur/${filename}`;

        res.status(200).json({
            success: true,
            url: imageUrl,
            filename: filename,
        });
    } catch (error) {
        console.error('Unexpected error in /chouffeur route:', error);
        next(error);
    }
});


// GET /image/:filename - Serves the image file (No change needed here)
// This route correctly serves images from UPLOAD_DIR
router.get('/uploads/:filename', (req, res, next) => { // Ensure next is passed
    const { filename } = req.params;
  
    // Security Validations
    if (filename.includes('..') || !filename.match(/^[a-zA-Z0-9._-]+(\.(jpg|jpeg|png|gif))$/i)) {
      // Use return to stop execution
      return res.status(400).json({ success: false, error: 'Invalid filename.' });
    }
  
    const filePath = path.join(UPLOAD_DIR, filename);
    const chauffeurFilePath = path.join(UPLOAD_DIRC, filename);
  
    // Check existence and send
    // Using async/await pattern here for clarity with fs.promises
    const sendFileFromPath = async (filePathToSend) => {
        try {
            await fs.access(filePathToSend, fs.constants.R_OK); // Check read access
            res.sendFile(filePathToSend, (err) => { // Use callback for sendFile errors
                if (err) {
                    console.error(`Error sending file ${filePathToSend}:`, err);
                    // Pass error to central handler *if* headers haven't been sent
                    if (!res.headersSent) {
                        next(new Error(`Failed to serve image: ${err.message}`)); // CORRECT: Pass error object to next
                    }
                }
            });
        } catch (accessError) {
            // This error means the file wasn't found or no permissions
            return false; // Indicate file not sent from this path
        }
        return true; // Indicate file sending initiated
    };
  
    (async () => { // IIFE for async logic
        if (await sendFileFromPath(filePath)) return; // Try primary dir, exit if sent
        if (await sendFileFromPath(chauffeurFilePath)) return; // Try secondary dir, exit if sent
  
        // If neither sendFileFromPath returned true, the file wasn't found
        console.error(`File not found in any directory: ${filename}`);
        res.status(404).json({ success: false, error: 'Image not found.' });
  
    })().catch(next); // Catch any unexpected errors in the async IIFE and pass to error handler
  
  });
  
  router.delete('/image/:filename', async (req, res, next) => { // Ensure next is passed
    const { filename } = req.params;
    console.log(`Received request to delete image: ${filename}`);
  
    // --- Security Validations ---
    if (!filename || filename.includes('..') || !filename.match(/^[a-zA-Z0-9._-]+(\.(jpg|jpeg|png|gif))$/i)) {
      console.warn(`Invalid filename for deletion attempt: ${filename}`);
      // Send response directly for validation errors
      return res.status(400).json({ success: false, error: 'Invalid filename format.' });
    }
  
    // --- Authorization Placeholder ---
    const isUserAuthorized = true; // <-- REPLACE with actual check!
    if (!isUserAuthorized) {
       console.warn(`Unauthorized delete attempt for file: ${filename}`);
       return res.status(403).json({ success: false, error: 'Forbidden: You do not have permission.' });
    }
    // --- End Security ---
  
    const filePath = path.join(UPLOAD_DIR, filename);
    const chauffeurFilePath = path.join(UPLOAD_DIRC, filename);
  
    try {
      let fileDeleted = false;
  
      // Try deleting from UPLOAD_DIR
      try {
          await fs.unlink(filePath);
          console.log(`Successfully deleted file: ${filePath}`);
          fileDeleted = true;
      } catch (err) {
          if (err.code !== 'ENOENT') { // ENOENT = file not found, okay
              console.error(`Error unlinking ${filePath}:`, err);
              throw err; // Rethrow other errors (permissions etc.)
          }
           console.log(`File not in primary dir: ${filename}`);
      }
  
      // Try deleting from UPLOAD_DIRC if not already deleted
      if (!fileDeleted) {
          try {
              await fs.unlink(chauffeurFilePath);
              console.log(`Successfully deleted file: ${chauffeurFilePath}`);
              fileDeleted = true;
          } catch (err) {
              if (err.code !== 'ENOENT') {
                  console.error(`Error unlinking ${chauffeurFilePath}:`, err);
                  throw err; // Rethrow other errors
              }
               console.log(`File not in secondary dir: ${filename}`);
          }
      }
  
      // --- Send Response based on deletion status ---
      if (fileDeleted) {
        return res.status(200).json({ success: true, message: 'Image deleted successfully.' });
      } else {
        // If we reach here, file wasn't found in either directory
        return res.status(404).json({ success: false, error: 'Image not found.' });
      }
  
    } catch (error) {
      // --- Pass UNEXPECTED errors to the central error handler ---
      console.error(`Unexpected error during delete for ${filename}:`, error);
      // CORRECT: Pass the error object to the 'next' function
      next(error);
      // DO NOT try to send a response here (like res.status(500)...)
      // Let the central error handler do that.
    }
  });
  
module.exports = router;