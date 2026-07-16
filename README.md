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

The site records each authenticated user ID once per day through the Dockerized
Daily Unique Visitor Counter. Different accounts count separately, while repeat
visits by the same account do not increase the daily unique count. Start the counter from
the repository's `daily-visitor-counter` directory:

```sh
docker compose up -d --build
```

During local development, Vite proxies `/visitor-api` to
`http://localhost:3000`. The Analytics page shows today's HyperLogLog estimate,
exact Set count, difference, and error percentage. Supabase remains responsible
for authentication and fleet records; Redis is used only for visitor analytics.

## Authentication setup

This project is a Vite React application, so it uses the existing Supabase browser
client and a React Router callback at `/auth/callback`. Sessions are created and
refreshed by Supabase Auth; the application does not store custom login flags or
passwords.

Create `.env.local` from `.env.example` and provide your project values:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY
VITE_VISITOR_API_URL=
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
3. Copy the API's generated `https://...onrender.com` URL.
4. In Vercel, set `VITE_VISITOR_API_URL` to that URL for Production.
5. Redeploy the Vercel project so Vite includes the environment variable in its build.

The Blueprint uses free Render services to avoid automatically selecting a paid
plan. Render's free Key Value service does not provide disk persistence. Select a
paid Key Value plan in Render when persistent production analytics are required.

Build the frontend locally with `npm run build`. Vercel serves the generated Vite
application and uses `vercel.json` to route React paths such as `/auth/callback`.
