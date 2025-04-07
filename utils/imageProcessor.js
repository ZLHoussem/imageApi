// utils/imageProcessor.js
const sharp = require('sharp');
const fs = require('fs').promises; // Use promises for async file operations
const path = require('path');
const { IMAGE_QUALITY } = require('../config/config');

/**
 * Optimizes an image using Sharp.
 * Converts to JPEG, sets quality, and deletes the original file.
 * @param {string} filePath - Path to the original image file.
 * @param {number} [quality=IMAGE_QUALITY] - JPEG quality (0-100).
 * @returns {Promise<string>} - Path to the optimized image file.
 * @throws {Error} - If optimization fails.
 */
async function optimizeImage(filePath, quality = IMAGE_QUALITY) {
  try {
    const originalExt = path.extname(filePath);
    const optimizedFilePath = filePath.replace(originalExt, '_optimized.jpg');

    console.log(`Optimizing image: ${filePath} to ${optimizedFilePath}`);

    await sharp(filePath)
      // .resize(800) // Optional: Add resizing if needed
      .toFormat('jpeg')
      .jpeg({ quality: quality, progressive: true })
      .toFile(optimizedFilePath);

    console.log(`Optimization successful. Deleting original: ${filePath}`);
    await fs.unlink(filePath); // Asynchronously delete the original file

    return optimizedFilePath;
  } catch (error) {
    console.error(`Image optimization error for ${filePath}:`, error);
    // Attempt to clean up the original file even if optimization fails
    try {
      await fs.unlink(filePath);
      console.log(`Cleaned up original file after optimization error: ${filePath}`);
    } catch (unlinkError) {
      console.error(`Error cleaning up original file ${filePath} after optimization error:`, unlinkError);
    }
    throw new Error('Image optimization failed.');
  }
}

module.exports = { optimizeImage };