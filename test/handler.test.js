const { handleUrl } = require('../src/modules/handler');

// Mock the dependencies
jest.mock('../src/modules/urlValidator');
jest.mock('../src/modules/metadataFetcher');
jest.mock('../src/modules/instagramHandler');
jest.mock('../src/modules/discordClient');
jest.mock('../src/modules/logger');
jest.mock('fs');

const { isValidUrl, isInstagramUrl } = require('../src/modules/urlValidator');
const { fetchMetadata } = require('../src/modules/metadataFetcher');
const { downloadInstagramMedia } = require('../src/modules/instagramHandler');
const { sendToDiscord } = require('../src/modules/discordClient');
const fs = require('fs');

describe('URL Handler', () => {
  const mockEndpoint = {
    path: '/share/test',
    webhookUrl: 'https://discord.com/api/webhooks/123/abc',
    isForumChannel: false,
    name: 'Test Channel'
  };

  const mockConfig = {
    tempDir: './temp',
    maxFileSize: 8388608
  };

  beforeEach(() => {
    jest.clearAllMocks();
    fs.existsSync.mockReturnValue(true);
    fs.unlinkSync.mockImplementation(() => {});
  });

  it('should throw ValidationError for invalid URL', async () => {
    isValidUrl.mockReturnValue(false);

    await expect(handleUrl('invalid-url', mockEndpoint, mockConfig)).rejects.toThrow('Invalid URL provided');
  });

  it('should handle non-Instagram URL for text channel', async () => {
    isValidUrl.mockReturnValue(true);
    isInstagramUrl.mockReturnValue(false);
    fetchMetadata.mockResolvedValue({ title: 'Test Title', description: 'Test Description' });
    sendToDiscord.mockResolvedValue();

    await handleUrl('https://example.com', mockEndpoint, mockConfig);

    expect(fetchMetadata).toHaveBeenCalledWith('https://example.com');
    expect(sendToDiscord).toHaveBeenCalledWith(
      mockEndpoint.webhookUrl,
      '➡️ https://example.com',
      null,
      false,
      null
    );
  });

  it('should handle non-Instagram URL for forum channel', async () => {
    const forumEndpoint = { ...mockEndpoint, isForumChannel: true };
    isValidUrl.mockReturnValue(true);
    isInstagramUrl.mockReturnValue(false);
    fetchMetadata.mockResolvedValue({ title: 'Test Title', description: 'Test Description' });
    sendToDiscord.mockResolvedValue();

    await handleUrl('https://example.com', forumEndpoint, mockConfig);

    expect(sendToDiscord).toHaveBeenCalledWith(
      forumEndpoint.webhookUrl,
      'Test Description\n➡️ https://example.com',
      null,
      true,
      'Test Title'
    );
  });

  it('should handle Instagram URL with successful download', async () => {
    isValidUrl.mockReturnValue(true);
    isInstagramUrl.mockReturnValue(true);
    downloadInstagramMedia.mockResolvedValue('/temp/file.mp4');
    sendToDiscord.mockResolvedValue();

    await handleUrl('https://instagram.com/p/test', mockEndpoint, mockConfig);

    expect(downloadInstagramMedia).toHaveBeenCalledWith('https://instagram.com/p/test', './temp', 8388608);
    expect(sendToDiscord).toHaveBeenCalledWith(
      mockEndpoint.webhookUrl,
      '➡️ https://instagram.com/p/test',
      '/temp/file.mp4',
      false,
      null
    );
    expect(fs.unlinkSync).toHaveBeenCalledWith('/temp/file.mp4');
  });

  it('should handle Instagram URL download failure', async () => {
    isValidUrl.mockReturnValue(true);
    isInstagramUrl.mockReturnValue(true);
    downloadInstagramMedia.mockRejectedValue(new Error('Download failed'));
    sendToDiscord.mockResolvedValue();

    await handleUrl('https://instagram.com/p/test', mockEndpoint, mockConfig);

    expect(sendToDiscord).toHaveBeenCalledWith(
      mockEndpoint.webhookUrl,
      '➡️ https://instagram.com/p/test',
      null,
      false,
      null
    );
  });

  it('should cleanup temp file on error', async () => {
    isValidUrl.mockReturnValue(true);
    isInstagramUrl.mockReturnValue(true);
    downloadInstagramMedia.mockResolvedValue('/temp/file.mp4');
    sendToDiscord.mockRejectedValue(new Error('Discord error'));

    await expect(handleUrl('https://instagram.com/p/test', mockEndpoint, mockConfig)).rejects.toThrow('Failed to send to Discord');

    expect(fs.unlinkSync).toHaveBeenCalledWith('/temp/file.mp4');
  });
});