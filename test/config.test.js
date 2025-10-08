const fs = require('fs');
const { loadConfig } = require('../src/modules/config');

// Mock fs
jest.mock('fs');

describe('Config Loader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error if config.json does not exist', () => {
    fs.existsSync.mockReturnValue(false);

    expect(() => loadConfig()).toThrow('config.json not found');
  });

  it('should load and validate config correctly', () => {
    const mockConfig = {
      host: '0.0.0.0',
      port: 3000,
      tempDir: './temp',
      maxFileSize: 8388608,
      endpoints: [
        {
          path: '/share/test',
          webhookUrl: 'https://discord.com/api/webhooks/123/abc',
          isForumChannel: false,
          name: 'Test Channel'
        }
      ]
    };

    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

    const config = loadConfig();
    expect(config).toEqual(mockConfig);
  });

  it('should apply defaults', () => {
    const mockConfig = {
      endpoints: [
        {
          path: '/share/test',
          webhookUrl: 'https://discord.com/api/webhooks/123/abc',
          isForumChannel: false,
          name: 'Test Channel'
        }
      ]
    };

    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));

    const config = loadConfig();
    expect(config.host).toBe('0.0.0.0');
    expect(config.port).toBe(3000);
    expect(config.tempDir).toBe('./temp');
    expect(config.maxFileSize).toBe(8388608);
  });
});