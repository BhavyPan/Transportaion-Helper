# Transportation Helper

Transportation Helper is a Vite, React, TypeScript, shadcn-ui, and Tailwind CSS application for fleet management workflows.

## Getting started

Install dependencies and start the development server:

```sh
npm install
npm run dev
```

## Scripts

- `npm run dev` starts the local Vite development server.
- `npm run build` creates a production build.
- `npm run build:dev` creates a development-mode build.
- `npm run lint` runs ESLint.
- `npm run test` runs the Vitest test suite.
- `npm run preview` serves the production build locally.

## Technology

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Daily visitor analytics

The site records each browser or authenticated account once per day through the
Dockerized Daily Unique Visitor Counter. Anonymous visitors keep a UUID in
`localStorage`, so normal refresh and force-refresh reuse the same identity.
After Supabase finishes loading, authenticated visitors use the current Supabase
user ID. Start the counter from the repository's `daily-visitor-counter` directory:

```sh
docker compose up -d --build
```

Before the first start, copy `daily-visitor-counter/.env.example` to
`daily-visitor-counter/.env`. Replace `VISITOR_HASH_SECRET` with a stable random
value of at least 32 characters.

During local development, Vite proxies `/visitor-api` to
`http://localhost:3000`. The dashboard and Analytics page show the exact unique
total across all stored dates, today's exact total, logged-in unique visitors,
returning logged-in visitors for today and all time, HyperLogLog estimate,
difference, and error percentage. A returning logged-in visitor has completed at
least two successful sign-ins. Refreshes and restored Supabase sessions do not
count as another login. Supabase remains responsible for authentication and fleet
records; Redis is used only for visitor analytics.
The API stores HMAC hashes instead of raw browser or Supabase IDs. Clearing browser
storage, using incognito mode, another browser, or another device creates a new
anonymous identity. Daily Redis keys do not expire automatically.

## Authentication setup

This project is a Vite React application, so it uses the existing Supabase browser
client and a React Router callback at `/auth/callback`. Sessions are created and
refreshed by Supabase Auth; the application does not store custom login flags or
passwords.

Create `.env.local` from `.env.example` and provide your project values:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY
VITE_ANALYTICS_API_URL=http://localhost:3000
```

Do not use a Supabase service-role key in this frontend file. Keep real values out
of `.env.example` and source control.

### Apply the security migrations

For an existing Supabase project, run these files separately and in order in the
Supabase SQL Editor:

1. `supabase/migrations/001_add_user_role.sql`
2. `supabase/migrations/002_secure_oauth_profiles.sql`

The first migration adds the safe `User` role. The second makes it the default,
prevents users from changing their own role, and applies role-aware RLS policies.
Existing Manager, Dispatcher, Safety Officer, and Finance roles are preserved.
Assign elevated roles only through a trusted administrative process such as the
Supabase SQL Editor; the public signup form cannot choose a role.

### Supabase Dashboard

In **Authentication > Providers > Google**:

1. Enable the Google provider.
2. Enter the Google OAuth Client ID.
3. Enter the Google OAuth Client Secret.

In **Authentication > URL Configuration**, configure:

```text
Site URL: http://localhost:8080
Redirect URL: http://localhost:8080/auth/callback
Production Site URL: https://transportaion-helper.vercel.app
Production redirect: https://transportaion-helper.vercel.app/auth/callback
```

### Google Cloud OAuth client

Create a **Web application** OAuth client and configure:

```text
Authorized JavaScript origin: http://localhost:8080
Production origin: https://transportaion-helper.vercel.app
Authorized redirect URI: https://SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback
```

The Google Cloud redirect URI is Supabase's provider callback URL. The application
callback URL is `/auth/callback`. They are different URLs and both are required:
Google returns to Supabase first, then Supabase returns to this application.

## Deployment

The Vite frontend is deployed on Vercel. The repository's `render.yaml` Blueprint
defines a public Docker API and a private Redis-compatible Render Key Value service.

To enable analytics on the live website:

1. In Render, create a new Blueprint and connect this GitHub repository.
2. Deploy the `daily-visitor-counter-api` and `daily-visitor-counter-redis` services.
3. The Blueprint generates `VISITOR_HASH_SECRET` automatically.
4. Copy the API's generated `https://...onrender.com` URL.
5. In Vercel, set `VITE_ANALYTICS_API_URL` to that URL for Production.
6. Redeploy the Vercel project so Vite includes the environment variable in its build.

The Blueprint uses free Render services to avoid automatically selecting a paid
plan. Render's free Key Value service does not provide disk persistence. Select a
paid Key Value plan in Render when persistent production analytics are required.

Build the frontend locally with `npm run build`. Vercel serves the generated Vite
application and uses `vercel.json` to route React paths such as `/auth/callback`.
