# Fitness Tracker

A personal fitness tracking web app built with **Next.js** (App Router), **TypeScript**, **Tailwind CSS**, and **Supabase**. Track daily food intake, workouts, exercises, and body stats with email/password authentication.

## Features

- **Auth**: Email/password sign up and sign in via Supabase Auth
- **Food**: Log meals, save frequent foods, view daily calorie and macro totals
- **Workouts**: Create sessions by date, add exercises (sets, reps, weight, notes)
- **Stats**: Body weight history, workout frequency by week, nutrition daily totals
- **Protected routes**: Only logged-in users can access `/app/*`
- **Dark UI**: Mobile-first, modern dark theme

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL Editor, run the schema: copy the contents of `supabase/schema.sql` and execute it.
3. In Project Settings → API, copy the **Project URL** and **anon (public) key**.

### 3. Environment variables

Copy the example env file and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You’ll be redirected to `/login`. Sign up, then you’ll be redirected to the dashboard at `/app`.

## Project structure

```
src/
├── app/
│   ├── app/              # Protected app (dashboard)
│   │   ├── layout.tsx    # App shell + nav
│   │   ├── page.tsx      # Food tab (default)
│   │   ├── workouts/
│   │   └── stats/
│   ├── login/
│   ├── signup/
│   ├── layout.tsx
│   └── page.tsx          # Redirects to /login or /app
├── components/
│   ├── app-nav.tsx       # Tabs + sign out
│   ├── food/             # Food tab components
│   ├── workouts/         # Workout components
│   └── stats/            # Stats components
├── lib/
│   └── supabase/
│       ├── client.ts     # Browser client
│       ├── server.ts     # Server client
│       └── middleware.ts # Session refresh + route protection
├── types/
│   └── database.ts       # DB types
└── middleware.ts        # Auth middleware
```

## Auth flow

- **`/`** → Redirects to `/login` (guest) or `/app` (logged in).
- **`/login`, `/signup`** → Public. If already logged in, redirect to `/app`.
- **`/app`, `/app/workouts`, `/app/stats`** → Protected. If not logged in, redirect to `/login?redirect=/app`.
- After sign in, user is sent to `redirect` query param or `/app`.
- Middleware refreshes the Supabase session and sets cookies on each request.

## Database (Supabase)

Tables (all scoped by `user_id` via RLS):

| Table             | Purpose                                  |
|------------------|------------------------------------------|
| `foods`          | Saved frequent foods (name, macros)      |
| `food_entries`   | Logged food per day                      |
| `workout_sessions` | One session per user per date         |
| `exercise_entries` | Exercises in a session (name, sets, reps, weight, notes) |
| `body_logs`      | Weight (and notes) per date              |

Run `supabase/schema.sql` in the Supabase SQL Editor to create tables, indexes, and RLS policies.

## Tech stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS 4**
- **Supabase** (Auth + Postgres)
