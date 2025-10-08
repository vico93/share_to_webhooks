const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Fetches OpenGraph metadata from a URL with retries
 * @param {string} url - The URL to fetch metadata from
 * @returns {Promise<{title: string, description: string}>} Metadata object
 */
async function fetchMetadata(url) {
  const maxRetries = 3;
  const timeout = 10000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.get(url, {
        timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ShareToWebhooks/1.0)'
        }
      });

      const $ = cheerio.load(response.data);
      const title = $('meta[property="og:title"]').attr('content') || 'New Link';
      const description = $('meta[property="og:description"]').attr('content') || 'Shared link';

      return { title, description };
    } catch (error) {
      if (attempt === maxRetries) {
        // Fallback on final failure
        return { title: 'New Link', description: 'Shared link' };
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

module.exports = { fetchMetadata };