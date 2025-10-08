/**
 * Custom error classes for consistent error handling
 */

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

class ProcessingError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ProcessingError';
  }
}

class DiscordError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DiscordError';
  }
}

class InstagramError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InstagramError';
  }
}

module.exports = {
  ValidationError,
  ProcessingError,
  DiscordError,
  InstagramError
};