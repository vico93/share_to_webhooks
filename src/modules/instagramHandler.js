const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Downloads Instagram media using yt-dlp
 * @param {string} url - Instagram URL
 * @param {string} tempDir - Temporary directory path
 * @param {number} maxSize - Maximum file size in bytes
 * @returns {Promise<string|null>} Path to downloaded file or null if too large or failed
 */
function downloadInstagramMedia(url, tempDir, maxSize) {
  return new Promise((resolve, reject) => {
    // Generate unique filename
    const fileName = crypto.randomBytes(16).toString('hex') + '.mp4';
    const filePath = path.join(tempDir, fileName);

    // yt-dlp command with size limit
    const args = [
      '-o', filePath,
      '--no-playlist',
      '--max-filesize', `${maxSize}b`,
      '--quiet',
      '--no-warnings',
      url
    ];

    const proc = spawn('yt-dlp', args, { stdio: 'pipe' });

    let stderr = '';
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        try {
          const stats = fs.statSync(filePath);
          if (stats.size <= maxSize) {
            resolve(filePath);
          } else {
            fs.unlinkSync(filePath);
            resolve(null);
          }
        } catch (error) {
          reject(error);
        }
      } else {
        // Cleanup on failure
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        reject(new Error(`yt-dlp failed: ${stderr}`));
      }
    });

    proc.on('error', (error) => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      reject(error);
    });
  });
}

module.exports = { downloadInstagramMedia };