# Memoir

> Your life, beautifully written. — getmemoir.com

## Quick Start

```bash
# 1. Install all dependencies
npm install

# 2. Copy env files and fill in keys
cp apps/backend/.env.example apps/backend/.env
cp apps/mobile/.env.example apps/mobile/.env

# 3. Start Redis (required for BullMQ)
redis-server &

# 4. Run backend (port 3000)
npm run dev:backend

# 5. Run mobile (scan QR with Expo Go)
npm run dev:mobile
```

## Run Tests

```bash
npm run test:backend   # Vitest — backend unit + integration tests
npm run test:mobile    # Jest — React Native unit tests
```

## Supabase Setup

1. Create a project at supabase.com
2. Go to SQL Editor → paste `supabase/schema.sql` → run
3. Copy `Project URL` and `service_role` key into `apps/backend/.env`
4. Copy `Project URL` and `anon` key into `apps/mobile/.env`

## Structure

```
memoir/
├── apps/
│   ├── mobile/          # React Native (Expo Router)
│   └── backend/         # Fastify API + BullMQ workers
├── packages/
│   └── shared/          # Shared TypeScript types
├── supabase/
│   └── schema.sql       # Full DB schema (run once in Supabase)
└── .github/workflows/   # CI/CD pipelines
```

## GitHub Secrets Required

| Secret | Source |
|--------|--------|
| `EXPO_TOKEN` | expo.dev |
| `RAILWAY_TOKEN` | railway.app |
| `SENTRY_ORG` / `SENTRY_TOKEN` | sentry.io |
| `ASC_API_KEY_ID` / `ASC_API_KEY_ISSUER_ID` / `ASC_API_KEY` | App Store Connect |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | Google Play Console |
| `CODECOV_TOKEN` | codecov.io |
