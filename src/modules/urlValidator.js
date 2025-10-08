/**
 * Validates if a string is a valid HTTP or HTTPS URL
 * @param {string} url - The URL string to validate
 * @returns {boolean} True if valid, false otherwise
 */
function isValidUrl(url) {
  if (typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Checks if the URL is from Instagram
 * @param {string} url - The URL string
 * @returns {boolean} True if Instagram URL
 */
function isInstagramUrl(url) {
  return url.includes('instagram.com');
}

module.exports = { isValidUrl, isInstagramUrl };