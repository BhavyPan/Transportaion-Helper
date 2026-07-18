require('dotenv').config();

const express = require('express');
const { redisClient, connectRedis } = require('./redis');
const {
  VisitorValidationError,
  hashVisitorId,
  normalizeVisitorId,
  validateIdentityConfiguration,
} = require('./identity');

const app = express();

const allowedOrigins = new Set(
  getRequiredEnvironmentVariable('FRONTEND_ORIGIN')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
);

const port = parsePositiveInteger(process.env.PORT, 'PORT');
const appTimezone = getRequiredEnvironmentVariable('APP_TIMEZONE');
const allTimeVisitorSetKey = 'visitors:set:all-time';
const allTimeLoggedInVisitsKey = 'visitors:logged-in:visits:all-time';

validateTimezone(appTimezone);
validateIdentityConfiguration();

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

app.use(express.json({ limit: '16kb' }));

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
    loggedInSetKey: `visitors:logged-in:set:${date}`,
    loggedInVisitsKey: `visitors:logged-in:visits:${date}`,
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

async function getStatistics(date, includeAllTime = false) {
  const { hllKey, setKey, loggedInSetKey, loggedInVisitsKey } =
    getDailyKeys(date);
  const transaction = redisClient
    .multi()
    .pfCount(hllKey)
    .sCard(setKey)
    .sCard(loggedInSetKey)
    .zCount(loggedInVisitsKey, 2, '+inf');

  if (includeAllTime) {
    transaction
      .sCard(allTimeVisitorSetKey)
      .zCount(allTimeLoggedInVisitsKey, 2, '+inf');
  }

  const [
    estimatedUniqueVisitors,
    exactUniqueVisitors,
    loggedInUniqueVisitors,
    returningLoggedInVisitors,
    allTimeUniqueVisitors,
    allTimeReturningLoggedInVisitors,
  ] = await runRedisOperation(() => transaction.exec());

  const difference = exactUniqueVisitors - estimatedUniqueVisitors;
  const errorPercentage =
    exactUniqueVisitors === 0
      ? 0
      : Number(
          ((Math.abs(difference) / exactUniqueVisitors) * 100).toFixed(2),
        );

  const statistics = {
    date,
    totalUniqueVisitors: exactUniqueVisitors,
    loggedInUniqueVisitors,
    returningLoggedInVisitors,
    estimatedUniqueVisitors,
    exactUniqueVisitors,
    difference,
    errorPercentage,
  };

  if (includeAllTime) {
    statistics.allTimeUniqueVisitors = allTimeUniqueVisitors;
    statistics.allTimeReturningLoggedInVisitors =
      allTimeReturningLoggedInVisitors;
  }

  return statistics;
}

async function backfillAllTimeVisitors() {
  const dailySetKeys = [];

  for await (const key of redisClient.scanIterator({
    MATCH: 'visitors:set:*',
    COUNT: 100,
  })) {
    if (/^visitors:set:\d{4}-\d{2}-\d{2}$/.test(key)) {
      dailySetKeys.push(key);
    }
  }

  if (dailySetKeys.length === 0) {
    return;
  }

  await runRedisOperation(() =>
    redisClient.sUnionStore(allTimeVisitorSetKey, [
      allTimeVisitorSetKey,
      ...dailySetKeys,
    ]),
  );
}

async function backfillAllTimeLoggedInVisits() {
  const allTimeKeyExists = await runRedisOperation(() =>
    redisClient.exists(allTimeLoggedInVisitsKey),
  );

  if (allTimeKeyExists) {
    return;
  }

  const dailyLoggedInVisitsKeys = [];

  for await (const key of redisClient.scanIterator({
    MATCH: 'visitors:logged-in:visits:*',
    COUNT: 100,
  })) {
    if (
      /^visitors:logged-in:visits:[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(
        key,
      )
    ) {
      dailyLoggedInVisitsKeys.push(key);
    }
  }

  if (dailyLoggedInVisitsKeys.length === 0) {
    return;
  }

  await runRedisOperation(() =>
    redisClient.sendCommand([
      'ZUNIONSTORE',
      allTimeLoggedInVisitsKey,
      String(dailyLoggedInVisitsKeys.length),
      ...dailyLoggedInVisitsKeys,
      'AGGREGATE',
      'SUM',
    ]),
  );
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

app.post('/api/analytics/visit', async (request, response, next) => {
  try {
    const visitorId = normalizeVisitorId(request.body?.visitorId);
    const visitorHash = hashVisitorId(visitorId);
    const date = getCurrentDate(appTimezone);
    const { hllKey, setKey, loggedInSetKey, loggedInVisitsKey } =
      getDailyKeys(date);
    const isLoggedInVisitor = visitorId.startsWith('user:');
    const isLoginEvent =
      isLoggedInVisitor && request.body?.loginEvent === true;

    const transaction = redisClient
      .multi()
      .pfAdd(hllKey, visitorHash)
      .sAdd(setKey, visitorHash)
      .sAdd(allTimeVisitorSetKey, visitorHash);

    if (isLoggedInVisitor) {
      transaction.sAdd(loggedInSetKey, visitorHash);
    }

    if (isLoginEvent) {
      transaction
        .zIncrBy(loggedInVisitsKey, 1, visitorHash)
        .zIncrBy(allTimeLoggedInVisitsKey, 1, visitorHash);
    }

    const [, exactVisitorAdded] = await runRedisOperation(() =>
      transaction.exec(),
    );

    const newExactVisitor = exactVisitorAdded === 1;

    return response.status(newExactVisitor ? 201 : 200).json({
      success: true,
      message: newExactVisitor
        ? 'New unique visitor recorded'
        : 'Visitor was already counted today',
      date,
      newExactVisitor,
    });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/analytics/daily', async (request, response, next) => {
  try {
    const date = getCurrentDate(appTimezone);
    return response.json(await getStatistics(date, true));
  } catch (error) {
    return next(error);
  }
});

app.get('/api/analytics/daily/:date', async (request, response, next) => {
  try {
    const { date } = request.params;

    if (!isValidDate(date)) {
      return response.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD',
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
    message: 'Route not found',
  });
});

app.use((error, request, response, next) => {
  if (error instanceof VisitorValidationError) {
    return response.status(400).json({
      success: false,
      message: error.message,
    });
  }

  if (error instanceof RedisUnavailableError) {
    console.error('Redis request failed:', error.cause || error);

    return response.status(503).json({
      success: false,
      message: 'Redis service is unavailable',
    });
  }

  console.error('Unexpected error:', error);

  return response.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});

let httpServer;
let isShuttingDown = false;

async function startServer() {
  try {
    await connectRedis();
    await backfillAllTimeVisitors();
    await backfillAllTimeLoggedInVisits();
    httpServer = app.listen(port, '0.0.0.0', () => {
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
