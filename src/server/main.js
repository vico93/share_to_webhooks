const express = require('express');
const fs = require('fs');
const path = require('path');
const { loadConfig } = require('../modules/config');
const { handleUrl } = require('../modules/handler');
const logger = require('../modules/logger');
const { ValidationError, ProcessingError } = require('../utils/errors');

// Load configuration
let config;
try {
  config = loadConfig();
} catch (error) {
  console.error('Failed to load configuration:', error.message);
  process.exit(1);
}

// Ensure temp directory exists
if (!fs.existsSync(config.tempDir)) {
  fs.mkdirSync(config.tempDir, { recursive: true });
  logger.info(`Created temp directory: ${config.tempDir}`);
}

// Set up periodic temp cleanup (every hour)
setInterval(() => {
  fs.readdir(config.tempDir, (err, files) => {
    if (err) return;
    const now = Date.now();
    files.forEach(file => {
      const filePath = path.join(config.tempDir, file);
      fs.stat(filePath, (err, stats) => {
        if (err) return;
        // Remove files older than 1 hour
        if (now - stats.mtime.getTime() > 3600000) {
          fs.unlink(filePath, (err) => {
            if (!err) logger.debug(`Cleaned up old temp file: ${file}`);
          });
        }
      });
    });
  });
}, 3600000);

// Create Express app
const app = express();

// Middleware
app.use(express.json({ limit: '1mb' })); // Limit body size for security

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Input sanitization middleware
app.use((req, res, next) => {
  if (req.body && req.body.url) {
    req.body.url = req.body.url.trim();
  }
  next();
});

// Dynamically register routes
config.endpoints.forEach(endpoint => {
  app.post(endpoint.path, async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }

      await handleUrl(url, endpoint, config);
      res.status(200).json({ message: 'URL shared successfully' });
    } catch (error) {
      logger.error(`Error processing request: ${error.message}`);
      if (error instanceof ValidationError) {
        res.status(400).json({ error: error.message });
      } else if (error instanceof ProcessingError) {
        res.status(500).json({ error: 'Failed to process URL' });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });
});

// Start server
app.listen(config.port, config.host, () => {
  logger.info(`Server listening on ${config.host}:${config.port}`);
  logger.info(`Configured endpoints: ${config.endpoints.map(e => e.path).join(', ')}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down server...');
  process.exit(0);
});