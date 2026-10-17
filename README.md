# Fitness Tracker

A personal fitness app (installable on your phone) built with **Next.js** (App Router), **TypeScript**, **Tailwind CSS**, **PostgreSQL**, **Drizzle ORM** and **Better Auth**. Track food (with barcode scanning and a built-in food list), workouts (daily max per exercise, workout days), body weight and stats.

Everything is self-hosted: the database and user accounts live in your own Postgres.

## Stack

| Part | What |
| --- | --- |
| App + backend | Next.js 16 — pages render on the server, data changes go through **server actions** (`src/app/actions/`) |
| Database | PostgreSQL 17 (Docker) |
| Queries & migrations | Drizzle ORM — schema in `src/db/schema.ts`, SQL migrations in `drizzle/` |
| Accounts | Better Auth — email + password, sessions in Postgres (`src/lib/auth.ts`) |

Every query is scoped to the signed-in user (`user_id` on every table, checked in server actions).

## Local development

Requirements: Node.js 20+ and Docker Desktop.

```bash
npm install
cp .env.example .env.local      # then set BETTER_AUTH_SECRET to a long random string
npm run db:up                   # starts Postgres in Docker (docker-compose.dev.yml)
npm run dev                     # http://localhost:3000
```

Migrations run automatically when the app starts (`src/instrumentation.ts`). Open http://localhost:3000, create an account, and you're in.

### Database scripts

| Command | What it does |
| --- | --- |
| `npm run db:up` | Start local Postgres |
| `npm run db:generate` | Create a migration after changing `src/db/schema.ts` |
| `npm run db:migrate` | Apply migrations manually (normally automatic on startup) |
| `npm run db:studio` | Browse the database in Drizzle Studio |

## Deployment (Docker)

The `Dockerfile` builds a small standalone image; GitHub Actions publishes it to GHCR on every push to `main`.

`deployment.yml` runs the app and a Postgres container (database only reachable by the app). Provide these variables, e.g. in a `.env` file next to it:

```
POSTGRES_PASSWORD=<long random string>
BETTER_AUTH_SECRET=<long random string, e.g. openssl rand -base64 32>
BETTER_AUTH_URL=https://your-domain.example
SHARED_NETWORK_NAME=<your reverse-proxy network>
```

```bash
docker compose -f deployment.yml up -d
```

The app needs HTTPS (via your reverse proxy) to be installable on phones and to use the camera for barcode scanning.

**Backups:** the data lives in the `fitness-db` volume. A simple nightly dump:

```bash
docker exec shema.fitnessdb pg_dump -U fitness fitness | gzip > fitness-$(date +%F).sql.gz
```

## Project structure

```
src/
├── app/
│   ├── actions/        # Server actions (food, workouts, profile)
│   ├── api/auth/       # Better Auth endpoints
│   ├── app/            # Signed-in app: Food (/app), Workouts, Stats, Settings
│   ├── login/ signup/
│   └── manifest.ts     # PWA manifest
├── components/         # UI (food, workouts, stats, settings)
├── db/                 # Drizzle schema + connection
├── lib/                # auth, session helpers, food/exercise libraries, dates
├── instrumentation.ts  # runs migrations on startup
└── proxy.ts            # redirects signed-out users to /login
drizzle/                # generated SQL migrations
```
