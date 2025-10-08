const { isValidUrl, isInstagramUrl } = require('./urlValidator');
const { fetchMetadata } = require('./metadataFetcher');
const { downloadInstagramMedia } = require('./instagramHandler');
const { sendToDiscord } = require('./discordClient');
const logger = require('./logger');
const fs = require('fs');
const { ValidationError, ProcessingError } = require('../utils/errors');

/**
 * Handles the URL sharing process
 * @param {string} url - The URL to share
 * @param {object} endpoint - Endpoint configuration
 * @param {object} config - Full configuration
 */
async function handleUrl(url, endpoint, config) {
  if (!isValidUrl(url)) {
    throw new ValidationError('Invalid URL provided');
  }

  let content;
  let filePath = null;
  let threadName = null;

  if (isInstagramUrl(url)) {
    logger.info(`Processing Instagram URL: ${url}`);
    try {
      filePath = await downloadInstagramMedia(url, config.tempDir, config.maxFileSize);
      content = `➡️ ${url}`;
    } catch (error) {
      logger.warn(`Failed to download Instagram media: ${error.message}`);
      content = `➡️ ${url}`; // Fallback to URL only
    }
  } else {
    logger.info(`Fetching metadata for URL: ${url}`);
    const { title, description } = await fetchMetadata(url);
    if (endpoint.isForumChannel) {
      threadName = title;
      content = `${description}\n➡️ ${url}`;
    } else {
      content = `➡️ ${url}`;
    }
  }

  try {
    logger.info(`Sending to Discord webhook for ${endpoint.name}`);
    await sendToDiscord(endpoint.webhookUrl, content, filePath, endpoint.isForumChannel, threadName);
    logger.info('Successfully sent to Discord');
  } catch (error) {
    logger.error(`Failed to send to Discord: ${error.message}`);
    throw new ProcessingError('Failed to send to Discord');
  } finally {
    // Cleanup temp file
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
        logger.debug(`Cleaned up temp file: ${filePath}`);
      } catch (cleanupError) {
        logger.warn(`Failed to cleanup temp file: ${cleanupError.message}`);
      }
    }
  }
}

module.exports = { handleUrl };