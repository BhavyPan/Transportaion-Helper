# Transportation Helper: Daily Unique Visitor Counter

Transportation Helper is a fleet-management website with a Dockerized visitor
analytics system. The main competition feature is the **Daily Unique Visitor
Counter**, which uses Redis HyperLogLog for an estimated count and Redis Sets for
exact unique counts.

The counter supports anonymous visitors, Supabase-authenticated visitors, daily
statistics, lifetime statistics, returning-login analysis, Redis persistence, and
Docker deployment.

## Live submission

- **Live website:** https://transportaion-helper.vercel.app
- **Visitor analytics page:** https://transportaion-helper.vercel.app/analytics
- **GitHub repository:** https://github.com/BhavyPan/Transportaion-Helper
- **Analytics API health:** https://daily-visitor-counter-api.onrender.com/health
- **Today's analytics API:** https://daily-visitor-counter-api.onrender.com/api/analytics/daily

## Evaluator walkthrough

Follow these steps to find and demonstrate the visitor counter.

### 1. Create or access an account

1. Open the [live website](https://transportaion-helper.vercel.app).
2. If you are a new user, select **Request access**, enter your details, and
   complete signup.
3. If you already have an account, sign in using email/password or select
   **Continue with Google**.
4. After authentication, the website opens the dashboard.

### 2. Use an account that can view Analytics

The Analytics page is protected and can be opened only by accounts whose
Supabase profile role is **Manager** or **Finance**.

New public signups safely receive the **User** role and cannot promote themselves.
For evaluation, use a preconfigured Manager or Finance account supplied by the
project owner. Alternatively, the project owner can assign the role through the
Supabase Dashboard or SQL Editor, then the evaluator should sign out and sign in
again.

Do not place evaluator passwords or privileged Supabase keys in this repository.

### 3. Open the visitor analytics

1. Select **Analytics** in the top navigation.
2. You can also open
   [https://transportaion-helper.vercel.app/analytics](https://transportaion-helper.vercel.app/analytics)
   directly after signing in.
3. On the Fleet Analytics page, find the section labelled **Daily Visitor
   Counter** with the heading **Website Audience**.
4. The visitor section appears below the four fleet KPI cards and before the
   fleet charts.
5. Use the refresh icon in the section header to request the latest Redis
   statistics.

### 4. Read the counter values

| Value | Meaning |
| --- | --- |
| Total Visitors Till Now | Exact unique browser/account identifiers across every stored date |
| Total Visitors Today | Exact unique browser/account identifiers for today's Kolkata date |
| Logged-In Visitors Today | Unique Supabase accounts that visited today |
| Returning Logged-In Today | Accounts that completed at least two successful sign-ins today |
| Returning Logged-In Till Now | Accounts that completed at least two successful sign-ins across all dates |
| Estimated Visitors | Today's Redis HyperLogLog estimate |
| Difference | Exact daily count minus estimated daily count |
| Error Percentage | Absolute difference divided by the exact count, multiplied by 100 |

For small visitor counts, the estimated and exact values will often be identical.
HyperLogLog becomes valuable at large scale because it estimates unique visitors
with much less memory than storing every member in a Set.

## Suggested competition demonstration

Use this sequence to demonstrate that the system is counting correctly:

1. Open the live site in a normal browser. The browser is counted once today.
2. Refresh or force-refresh the page. The exact daily total does not increase
   because the same visitor identifier is reused.
3. Sign in with Account A. It appears in **Logged-In Visitors Today**.
4. Sign out and sign in with Account A again on the same day. Account A now
   qualifies for **Returning Logged-In Today**.
5. Sign in once with Account B. Logged-in visitors increase, but Account B is not
   returning today until it completes a second sign-in.
6. Open the website on another device, browser, or incognito session. It receives
   another anonymous UUID and increases the exact unique count.
7. On the next Kolkata calendar date, daily counters use new Redis keys and start
   from zero. Lifetime counters retain the previous data.

## How visitor identification works

### Anonymous visitors

An anonymous browser receives a UUID from:

~~~js
crypto.randomUUID()
~~~

It is stored in browser localStorage under:

~~~text
transportation_helper_visitor_id
~~~

The same UUID is reused after navigation, refresh, force-refresh, and browser
restart. Clearing browser storage, using incognito mode, changing browser, or
changing device creates another anonymous identity.

Anonymous identifier format:

~~~text
anonymous:<browser-uuid>
~~~

### Logged-in visitors

After Supabase authentication finishes, the verified Supabase user ID is used:

~~~text
user:<supabase-user-id>
~~~

Successful login events are recorded separately from ordinary page loads.
Refreshes and automatically restored Supabase sessions do not increase login
event counters.

### Backend privacy protection

The Express backend applies HMAC SHA-256 using **VISITOR_HASH_SECRET** before
writing an identifier to Redis. Redis stores hashes instead of raw UUIDs,
Supabase IDs, emails, names, or passwords.

## Counting flow

~~~text
Visitor opens the Vercel website
             |
             v
React creates or reads the visitor identifier
             |
             v
POST /api/analytics/visit
             |
             v
Render Node.js / Express backend
             |
             v
HMAC SHA-256 visitor hash
             |
             v
Redis HyperLogLog + Set + login sorted sets
             |
             v
Analytics page requests and displays statistics
~~~

The analytics backend is intentionally independent from Supabase. Supabase stores
authentication and fleet records; Redis stores visitor analytics.

## Redis data model

Every date uses separate keys:

~~~text
visitors:hll:YYYY-MM-DD
visitors:set:YYYY-MM-DD
visitors:logged-in:set:YYYY-MM-DD
visitors:logged-in:visits:YYYY-MM-DD
~~~

Lifetime statistics use:

~~~text
visitors:set:all-time
visitors:logged-in:visits:all-time
~~~

Redis commands used by the project:

~~~text
PFADD       Add a visitor hash to the daily HyperLogLog
PFCOUNT     Read the estimated daily unique count
SADD        Add a hash to an exact Set without duplicates
SCARD       Read an exact Set count
ZINCRBY     Record successful login occurrences
ZCOUNT      Count accounts with two or more logins
PING        Verify Redis connectivity
~~~

Visitor keys do not receive an application-level expiration. The Docker volume
preserves local Redis data across ordinary container restarts. Production
persistence also depends on the selected Render Key Value plan.

## Analytics API

### Record a visit

~~~http
POST /api/analytics/visit
Content-Type: application/json
~~~

~~~json
{
  "visitorId": "anonymous:550e8400-e29b-41d4-a716-446655440000"
}
~~~

After a successful login:

~~~json
{
  "visitorId": "user:550e8400-e29b-41d4-a716-446655440000",
  "loginEvent": true
}
~~~

### Today's statistics

~~~http
GET /api/analytics/daily
~~~

### Statistics for a stored date

~~~http
GET /api/analytics/daily/2026-07-17
~~~

### Health check

~~~http
GET /health
~~~

The website continues operating if the analytics service is temporarily
unavailable. The visitor section shows an error state without breaking fleet or
authentication features.

## Run locally

### Required software

- Node.js
- npm
- Docker Desktop, or Docker Engine with Docker Compose

### 1. Configure the frontend

Create **.env.local** from **.env.example**:

~~~env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY
VITE_ANALYTICS_API_URL=http://localhost:3000
~~~

Never use a Supabase service-role key in frontend environment variables.

### 2. Configure and start the counter

Create **daily-visitor-counter/.env** from
**daily-visitor-counter/.env.example**. Replace **VISITOR_HASH_SECRET** with a
stable random value containing at least 32 characters.

~~~sh
cd daily-visitor-counter
docker compose up -d --build
~~~

Docker starts exactly two services:

- **app**: Node.js and Express analytics API
- **redis**: Redis with the persistent **redis-data** volume

Useful commands:

~~~sh
docker compose ps
docker compose logs -f
docker compose down
~~~

Do not run **docker compose down -v** unless you intentionally want to delete the
local Redis analytics volume.

### 3. Start the website

From the repository root:

~~~sh
npm install
npm run dev
~~~

Open:

~~~text
http://localhost:8080
~~~

Vite proxies **/visitor-api** to **http://localhost:3000** during local
development.

## Authentication configuration

Apply the existing Supabase migrations separately and in order:

1. **supabase/migrations/001_add_user_role.sql**
2. **supabase/migrations/002_secure_oauth_profiles.sql**

The migrations preserve existing roles, default new accounts to **User**, prevent
self-promotion, and apply role-aware Row Level Security.

For Google authentication:

1. Enable Google in **Supabase Authentication > Providers**.
2. Add the Google OAuth Client ID and Client Secret in Supabase.
3. Configure these Supabase application URLs:

~~~text
Local site: http://localhost:8080
Local callback: http://localhost:8080/auth/callback
Production site: https://transportaion-helper.vercel.app
Production callback: https://transportaion-helper.vercel.app/auth/callback
~~~

4. Configure the Google Cloud Web application:

~~~text
Authorized JavaScript origin: http://localhost:8080
Production origin: https://transportaion-helper.vercel.app
Authorized redirect URI: https://SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback
~~~

The Google Cloud redirect URI is the Supabase provider callback. The application
callback is **/auth/callback**; both URLs are required.

## Deployment architecture

~~~text
Vercel
  React / Vite website
          |
          v
Render Web Service
  Dockerized Node.js / Express API
          |
          v
Render Key Value
  Redis analytics data
~~~

**render.yaml** defines the backend and Redis services. Vercel uses
**VITE_ANALYTICS_API_URL** to call the public Render API. Redis is not exposed
directly to website visitors.

## Verification commands

~~~sh
npm test
npm run lint
npm run build
~~~

From **daily-visitor-counter**:

~~~sh
docker compose ps
~~~

Both Docker services should report healthy before testing the local Analytics
page.

## Technology

- React, TypeScript, Vite
- Tailwind CSS and shadcn-ui
- Supabase Authentication and PostgreSQL
- Node.js and Express
- Redis HyperLogLog, Set, and sorted set
- Docker and Docker Compose
- Vercel and Render
