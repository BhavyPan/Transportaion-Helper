# Daily Unique Visitor Counter

A small Express API that records and reports daily unique visitors in Redis. It
stores each visitor in two Redis data structures so an estimated count can be
compared with an exact count.

## How counting works

- **Redis HyperLogLog** uses very little memory and returns an approximate unique
  count. It is useful when a small estimation error is acceptable.
- **Redis Set** stores every unique visitor ID and returns an exact count. It uses
  more memory as the number of visitors grows.

A trimmed visitor ID is added to both structures for the current date. Adding the
same ID again on that date does not increase the unique count. Each date has new
keys, so the same visitor can be counted again on another day. Keys expire after
the configured retention period.

## Requirements

- Node.js 18 or newer
- npm
- Redis 7 or newer running locally or at an accessible URL

Redis 7 is required because the API uses the `NX` option with `EXPIRE` to set a
key's expiration only when it does not already have one.

## Local setup

For development outside Docker, create a `.env` file with a localhost Redis URL:

```env
PORT=3000
REDIS_URL=redis://localhost:6379
APP_TIMEZONE=Asia/Kolkata
RETENTION_DAYS=30
```

Install dependencies:

```bash
npm install
```

Start the API:

```bash
npm start
```

For development with automatic restarts, run `npm run dev`.

## Docker requirements

Install either Docker Desktop, or Docker Engine with the Docker Compose plugin.
Docker Compose starts both the API and Redis, so Redis does not need to be started
separately.

The values in `.env.example` are configured for Docker. Compose also supplies
these values by default:

```env
PORT=3000
REDIS_URL=redis://redis:6379
APP_TIMEZONE=Asia/Kolkata
RETENTION_DAYS=30
```

### Start the application

```bash
docker compose up --build
```

The API is available at:

```text
http://localhost:3000
```

### Run in the background

```bash
docker compose up -d --build
```

### View logs

```bash
docker compose logs -f
```

### Check running containers

```bash
docker compose ps
```

### Stop containers

```bash
docker compose down
```

Normal container stops preserve Redis analytics in the named Docker volume. To
stop the containers and delete that stored data, run:

```bash
docker compose down -v
```

**Warning:** The `-v` option deletes the Redis Docker volume and all analytics
stored in it.

## Docker architecture

```text
Client
  |
  v
Node.js / Express container
  |
  v
Redis container
  |-- HyperLogLog
  `-- Set
```

The containers communicate over Docker Compose's internal network. Redis is not
published to the host; the API connects to it using the `redis` service name and
the URL `redis://redis:6379`.

## API endpoints

### API information

```http
GET /
```

Response:

```json
{
  "message": "Daily Unique Visitor Counter API"
}
```

### Health check

```http
GET /health
```

When Redis is reachable, the response is `200 OK`:

```json
{
  "status": "ok",
  "redis": "connected"
}
```

When Redis is unavailable, the response is `503 Service Unavailable`:

```json
{
  "status": "error",
  "redis": "disconnected"
}
```

Redis-dependent API endpoints also return `503 Service Unavailable` while Redis
cannot serve requests:

```json
{
  "success": false,
  "error": "Redis service is unavailable"
}
```

### Record a visitor

```http
POST /api/visits
Content-Type: application/json
```

Request:

```json
{
  "visitorId": "user123"
}
```

Successful response (`201 Created`):

```json
{
  "success": true,
  "message": "Visit recorded",
  "date": "2026-07-16"
}
```

Invalid visitor IDs receive `400 Bad Request`:

```json
{
  "success": false,
  "error": "A valid visitorId is required"
}
```

### Get today's statistics

```http
GET /api/stats/today
```

Response:

```json
{
  "success": true,
  "date": "2026-07-16",
  "estimatedUniqueVisitors": 998,
  "exactUniqueVisitors": 1000,
  "difference": 2,
  "errorPercentage": 0.2
}
```

### Get statistics for a date

```http
GET /api/stats/2026-07-15
```

The date must be a real calendar date in `YYYY-MM-DD` format. Missing Redis keys
produce a successful response with zero counts.

Response:

```json
{
  "success": true,
  "date": "2026-07-15",
  "estimatedUniqueVisitors": 5010,
  "exactUniqueVisitors": 5000,
  "difference": 10,
  "errorPercentage": 0.2
}
```

An invalid date receives `400 Bad Request`:

```json
{
  "success": false,
  "error": "Invalid date format. Use YYYY-MM-DD"
}
```

## Redis keys

Every date uses two keys:

```text
visitors:hll:YYYY-MM-DD
visitors:set:YYYY-MM-DD
```

For example:

```text
visitors:hll:2026-07-16
visitors:set:2026-07-16
```

## Statistics fields

- `estimatedUniqueVisitors`: approximate count returned by HyperLogLog `PFCOUNT`.
- `exactUniqueVisitors`: exact count returned by Set `SCARD`.
- `difference`: absolute difference between the estimated and exact counts.
- `errorPercentage`: difference divided by the exact count, multiplied by 100 and
  rounded to two decimal places. It is `0` when the exact count is zero.
