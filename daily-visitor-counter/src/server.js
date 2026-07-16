require('dotenv').config();

const express = require('express');
const { redisClient, connectRedis } = require('./redis');

const app = express();

const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
);

const port = parsePositiveInteger(process.env.PORT, 'PORT');
const appTimezone = getRequiredEnvironmentVariable('APP_TIMEZONE');
const retentionDays = parsePositiveInteger(
  process.env.RETENTION_DAYS,
  'RETENTION_DAYS',
);
const retentionSeconds = retentionDays * 24 * 60 * 60;

validateTimezone(appTimezone);

app.use((request, response, next) => {
  const origin = request.get('origin');

  if (!origin || !allowedOrigins.has(origin)) {
    if (request.method === 'OPTIONS') {
      return response.sendStatus(403);
    }

    return next();
  }

  response.setHeader('Access-Control-Allow-Origin', origin);
  response.vary('Origin');
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (request.method === 'OPTIONS') {
    return response.sendStatus(204);
  }

  return next();
});

app.use(express.json());

class RedisUnavailableError extends Error {
  constructor(cause) {
    super('Redis service is unavailable');
    this.name = 'RedisUnavailableError';
    this.cause = cause;
  }
}

function getRequiredEnvironmentVariable(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} environment variable is required`);
  }

  return value;
}

function parsePositiveInteger(value, name) {
  if (!/^\d+$/.test(value || '') || Number(value) < 1) {
    throw new Error(`${name} must be a positive integer`);
  }

  return Number(value);
}

function validateTimezone(timezone) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format();
  } catch (error) {
    throw new Error('APP_TIMEZONE must be a valid IANA timezone');
  }
}

function getCurrentDate(timezone, now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const dateParts = Object.fromEntries(
    parts
      .filter(({ type }) => ['year', 'month', 'day'].includes(type))
      .map(({ type, value }) => [type, value]),
  );

  return `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
}

function isLeapYear(year) {
  return year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);
}

function isValidDate(date) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);

  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12) {
    return false;
  }

  const daysInMonth = [
    31,
    isLeapYear(year) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  return day >= 1 && day <= daysInMonth[month - 1];
}

function getDailyKeys(date) {
  return {
    hllKey: `visitors:hll:${date}`,
    setKey: `visitors:set:${date}`,
  };
}

async function runRedisOperation(operation) {
  if (!redisClient.isReady) {
    throw new RedisUnavailableError(new Error('Redis client is not ready'));
  }

  try {
    return await operation();
  } catch (error) {
    throw new RedisUnavailableError(error);
  }
}

async function getStatistics(date) {
  const { hllKey, setKey } = getDailyKeys(date);
  const [estimatedUniqueVisitors, exactUniqueVisitors] =
    await runRedisOperation(() =>
      redisClient.multi().pfCount(hllKey).sCard(setKey).exec(),
    );

  const difference = Math.abs(
    estimatedUniqueVisitors - exactUniqueVisitors,
  );
  const errorPercentage =
    exactUniqueVisitors === 0
      ? 0
      : Number(((difference / exactUniqueVisitors) * 100).toFixed(2));

  return {
    success: true,
    date,
    estimatedUniqueVisitors,
    exactUniqueVisitors,
    difference,
    errorPercentage,
  };
}

app.get('/', (request, response) => {
  response.json({
    message: 'Daily Unique Visitor Counter API',
  });
});

app.get('/health', async (request, response) => {
  try {
    if (!redisClient.isReady) {
      throw new Error('Redis client is not ready');
    }

    await redisClient.ping();

    return response.json({
      status: 'ok',
      redis: 'connected',
    });
  } catch (error) {
    console.error('Redis health check failed:', error);

    return response.status(503).json({
      status: 'error',
      redis: 'disconnected',
    });
  }
});

app.post('/api/visits', async (request, response, next) => {
  try {
    const { visitorId } = request.body || {};

    if (
      typeof visitorId !== 'string' ||
      visitorId.trim().length === 0 ||
      visitorId.trim().length > 255
    ) {
      return response.status(400).json({
        success: false,
        error: 'A valid visitorId is required',
      });
    }

    const trimmedVisitorId = visitorId.trim();
    const date = getCurrentDate(appTimezone);
    const { hllKey, setKey } = getDailyKeys(date);

    await runRedisOperation(() =>
      redisClient
        .multi()
        .pfAdd(hllKey, trimmedVisitorId)
        .sAdd(setKey, trimmedVisitorId)
        .expire(hllKey, retentionSeconds, 'NX')
        .expire(setKey, retentionSeconds, 'NX')
        .exec(),
    );

    return response.status(201).json({
      success: true,
      message: 'Visit recorded',
      date,
    });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/stats/today', async (request, response, next) => {
  try {
    const date = getCurrentDate(appTimezone);
    return response.json(await getStatistics(date));
  } catch (error) {
    return next(error);
  }
});

app.get('/api/stats/:date', async (request, response, next) => {
  try {
    const { date } = request.params;

    if (!isValidDate(date)) {
      return response.status(400).json({
        success: false,
        error: 'Invalid date format. Use YYYY-MM-DD',
      });
    }

    return response.json(await getStatistics(date));
  } catch (error) {
    return next(error);
  }
});

app.use((request, response) => {
  response.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

app.use((error, request, response, next) => {
  if (error instanceof RedisUnavailableError) {
    console.error('Redis request failed:', error.cause || error);

    return response.status(503).json({
      success: false,
      error: 'Redis service is unavailable',
    });
  }

  console.error('Unexpected error:', error);

  return response.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

let httpServer;
let isShuttingDown = false;

async function startServer() {
  try {
    await connectRedis();
    httpServer = app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

async function shutdown(signal) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log(`${signal} received. Shutting down...`);

  try {
    if (httpServer) {
      await new Promise((resolve, reject) => {
        httpServer.close((error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    }

    if (redisClient.isOpen) {
      await redisClient.quit();
    }

    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

if (require.main === module) {
  startServer();
}

module.exports = {
  app,
  getCurrentDate,
  isValidDate,
};
