const fs = require('fs');
const path = require('path');
const { z } = require('zod');

// Define the schema for endpoints
const endpointSchema = z.object({
  path: z.string(),
  webhookUrl: z.string().url(),
  isForumChannel: z.boolean(),
  name: z.string(),
});

// Define the schema for the entire config
const configSchema = z.object({
  host: z.string().default('0.0.0.0'),
  port: z.number().default(3000),
  tempDir: z.string().default('./temp'),
  maxFileSize: z.number().default(8388608),
  endpoints: z.array(endpointSchema),
});

// Path to config.json
const configPath = path.join(__dirname, '../../config.json');

let config = null;

/**
 * Loads and validates the configuration from config.json
 * @throws {Error} If config.json is missing or invalid
 * @returns {Object} The validated configuration object
 */
function loadConfig() {
  if (config) return config;

  if (!fs.existsSync(configPath)) {
    throw new Error('config.json not found. Please copy config.example.json to config.json and configure it.');
  }

  const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  config = configSchema.parse(configData);

  return config;
}

module.exports = { loadConfig };