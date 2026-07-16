require('dotenv').config();

const { createClient } = require('redis');

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  throw new Error('REDIS_URL environment variable is required');
}

const redisClient = createClient({
  url: redisUrl,
  disableOfflineQueue: true,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
  },
});

redisClient.on('error', (error) => {
  console.error('Redis error:', error);
});

redisClient.on('connect', () => {
  console.log('Connecting to Redis...');
});

redisClient.on('ready', () => {
  console.log('Redis connection is ready');
});

let connectionPromise = null;

async function connectRedis() {
  if (redisClient.isReady) {
    return redisClient;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  if (redisClient.isOpen) {
    return redisClient;
  }

  connectionPromise = redisClient.connect();

  try {
    await connectionPromise;
    return redisClient;
  } finally {
    connectionPromise = null;
  }
}

module.exports = {
  redisClient,
  connectRedis,
};
