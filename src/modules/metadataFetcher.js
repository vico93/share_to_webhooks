const axios = require('axios');
const cheerio = require('cheerio');
const { URL } = require('url');

/**
 * Fetches metadata from a URL with multiple fallback strategies
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
        },
        validateStatus: (status) => status >= 200 && status < 400 // Allow 2xx and 3xx
      });

      const $ = cheerio.load(response.data);

      // Extract title with multiple fallbacks
      let title = $('meta[property="og:title"]').attr('content') ||
                  $('meta[name="twitter:title"]').attr('content') ||
                  $('title').text() ||
                  $('h1').first().text() ||
                  new URL(url).hostname;

      // Limit title to 100 characters
      if (title.length > 100) {
        title = title.substring(0, 100) + '...';
      }

      // Extract description with multiple fallbacks
      let description = $('meta[property="og:description"]').attr('content') ||
                        $('meta[name="twitter:description"]').attr('content') ||
                        $('meta[name="description"]').attr('content') ||
                        $('p').first().text() ||
                        'Shared link';

      // Limit description to 300 characters
      if (description.length > 300) {
        description = description.substring(0, 300) + '...';
      }

      return { title, description };
    } catch (error) {
      if (attempt === maxRetries) {
        // Fallback on final failure using domain
        const domain = new URL(url).hostname;
        return { title: domain, description: 'Shared link' };
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

module.exports = { fetchMetadata };