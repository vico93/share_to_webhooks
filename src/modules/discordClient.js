const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

/**
 * Sends a message to Discord webhook with optional attachment and retry logic
 * @param {string} webhookUrl - The webhook URL
 * @param {string} content - The message content
 * @param {string|null} filePath - Path to file to attach
 * @param {boolean} isForum - Whether it's a forum channel
 * @param {string|null} threadName - Thread name for forum channels
 * @returns {Promise<void>}
 */
async function sendToDiscord(webhookUrl, content, filePath = null, isForum = false, threadName = null) {
  const maxRetries = 3;
  let delay = 1000; // Initial delay 1s

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const form = new FormData();

      if (isForum && threadName) {
        form.append('thread_name', threadName);
      }

      form.append('content', content);

      if (filePath) {
        form.append('file', fs.createReadStream(filePath));
      }

      await axios.post(webhookUrl, form, {
        headers: form.getHeaders(),
        timeout: 30000
      });

      return; // Success
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
}

module.exports = { sendToDiscord };