const { createHmac } = require('node:crypto');

class VisitorValidationError extends Error {
  constructor() {
    super('A valid visitorId is required');
    this.name = 'VisitorValidationError';
  }
}

function getVisitorHashSecret() {
  const secret = process.env.VISITOR_HASH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error('VISITOR_HASH_SECRET must contain at least 32 characters');
  }

  return secret;
}

function validateIdentityConfiguration() {
  getVisitorHashSecret();
}

function normalizeVisitorId(visitorId) {
  if (
    typeof visitorId !== 'string' ||
    visitorId.trim().length === 0 ||
    visitorId.length > 200
  ) {
    throw new VisitorValidationError();
  }

  return visitorId.trim();
}

function hashVisitorId(visitorId) {
  return createHmac('sha256', getVisitorHashSecret())
    .update(visitorId)
    .digest('hex');
}

module.exports = {
  VisitorValidationError,
  hashVisitorId,
  normalizeVisitorId,
  validateIdentityConfiguration,
};
