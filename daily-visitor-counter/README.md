# Daily Unique Visitor Counter

This backend counts unique daily website visitors with Redis. HyperLogLog provides
the memory-efficient estimate, while a Set provides the exact comparison count.
Only HMAC SHA-256 visitor hashes are stored in Redis.

## Requirements

- Node.js
- npm
- Docker Desktop, or Docker Engine with Docker Compose

## Environment setup

Copy `.env.example` to `.env` and replace the hash secret with a stable random
value containing at least 32 characters:

```env
PORT=3000
REDIS_URL=redis://redis:6379
APP_TIMEZONE=Asia/Kolkata
VISITOR_HASH_SECRET=replace-with-a-long-random-secret
FRONTEND_ORIGIN=http://localhost:5173,http://localhost:3000,https://transportaion-helper.vercel.app
```

`FRONTEND_ORIGIN` is a comma-separated allowlist. Requests from other browser
origins do not receive CORS permission.

## Start with Docker

```sh
docker compose up --build
```

Run in the background:

```sh
docker compose up -d --build
```

The API is available at `http://localhost:3000`. Redis remains private on the
Docker network and the application connects to it through `redis://redis:6379`.

View status and logs:

```sh
docker compose ps
docker compose logs -f
```

Stop the containers without deleting analytics:

```sh
docker compose down
```

Delete the containers and the Redis volume:

```sh
docker compose down -v
```

**Warning:** `-v` permanently deletes all stored visitor analytics.

## API endpoints

### Health

```http
GET /health
```

Healthy response:

```json
{
  "status": "ok",
  "redis": "connected"
}
```

### Record a visitor

```http
POST /api/analytics/visit
Content-Type: application/json
```

Anonymous request:

```json
{
  "visitorId": "anonymous:550e8400-e29b-41d4-a716-446655440000"
}
```

Authenticated request:

```json
{
  "visitorId": "user:550e8400-e29b-41d4-a716-446655440000"
}
```

After a successful authentication, the frontend sends:

```json
{
  "visitorId": "user:550e8400-e29b-41d4-a716-446655440000",
  "loginEvent": true
}
```

Only authenticated identifiers with `loginEvent: true` increment the daily and
all-time login counters. Ordinary page loads and refreshes still record the unique
visitor but do not increment login counters.

New visitor response:

```json
{
  "success": true,
  "date": "2026-07-17",
  "newExactVisitor": true,
  "message": "New unique visitor recorded"
}
```

Repeated visitor response:

```json
{
  "success": true,
  "date": "2026-07-17",
  "newExactVisitor": false,
  "message": "Visitor was already counted today"
}
```

`visitorId` must be a non-empty string containing at most 200 characters.

### Today's statistics

```http
GET /api/analytics/daily
```

### Statistics by date

```http
GET /api/analytics/daily/2026-07-17
```

Dates must be real calendar dates in `YYYY-MM-DD` format.

Statistics response:

```json
{
  "date": "2026-07-17",
  "allTimeUniqueVisitors": 250,
  "allTimeReturningLoggedInVisitors": 40,
  "totalUniqueVisitors": 101,
  "loggedInUniqueVisitors": 60,
  "returningLoggedInVisitors": 15,
  "estimatedUniqueVisitors": 100,
  "exactUniqueVisitors": 101,
  "difference": 1,
  "errorPercentage": 0.99
}
```

`GET /api/analytics/daily` includes `allTimeUniqueVisitors` and
`allTimeReturningLoggedInVisitors`. The date-specific endpoint keeps the daily
response fields shown above except for those all-time fields. `difference` is the
exact count minus the estimate. Error percentage uses the absolute difference and
returns zero when the exact count is zero.

- `allTimeUniqueVisitors` counts each hashed visitor identifier once across all
  stored dates.
- `allTimeReturningLoggedInVisitors` counts authenticated users with at least
  two successful login events across all stored dates.
- `totalUniqueVisitors` counts all logged-in and anonymous visitors once per day.
- `loggedInUniqueVisitors` counts authenticated visitors once per day.
- `returningLoggedInVisitors` counts authenticated users with at least two
  successful login events that day.
- `estimatedUniqueVisitors` is the HyperLogLog estimate across all visitors.

## Redis storage

Each date uses two keys:

```text
visitors:hll:YYYY-MM-DD
visitors:set:YYYY-MM-DD
visitors:logged-in:set:YYYY-MM-DD
visitors:logged-in:visits:YYYY-MM-DD
visitors:set:all-time
visitors:logged-in:visits:all-time
```

The backend uses `PFADD` and `PFCOUNT` for the estimate, Sets for exact unique
counts, and sorted sets for successful login counts. The all-time Set and sorted
set are backfilled from existing daily data when first created. Visitor keys do
not receive an expiration and remain available until they are manually deleted.
The `redis-data` Docker volume preserves data across ordinary container restarts.

## Local development without Docker

Run Redis locally, set `REDIS_URL=redis://localhost:6379`, then run:

```sh
npm install
npm start
```
