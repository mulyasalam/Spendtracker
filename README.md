# SpendTracker

SpendTracker is a mobile-first expense tracking app built with Next.js. It supports account signup/login, transaction tracking, daily spending plans, and a history view.

## Stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Drizzle ORM
- Neon Postgres via `@neondatabase/serverless`

## Features

- Email/password authentication
- Daily spending target and safe-to-spend indicator
- Transaction entry by category
- History views by day, week, month, and year
- Local file-backed fallback when `DATABASE_URL` is not set

## Requirements

- Node.js 20+
- npm

## Environment

Copy `.env.example` to `.env` and set values as needed.

```env
DATABASE_URL=
SEED_USER_EMAIL=demo@spendtracker.local
SEED_USER_NAME=Demo User
SEED_USER_PASSWORD=password123
```

`DATABASE_URL` is optional. If it is missing, the app falls back to a local JSON store under `.data/`.

## Local Development

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

For LAN/mobile testing:

```bash
npm run dev:mobile
```

## Production Build

```bash
npm run build
npm run start
```

## Database

Drizzle scripts:

```bash
npm run db:generate
npm run db:migrate
npm run db:push
npm run db:seed
npm run db:studio
```

Main tables:

- `app_users`
- `app_sessions`
- `transactions`
- `daily_plans`

## Deployment Notes

- Set `DATABASE_URL` in production if you want persistent shared storage.
- Without `DATABASE_URL`, data is stored locally on disk and is not suitable for most hosted deployments.
- Build command: `npm run build`
- Start command: `npm run start`

## Repository

GitHub: https://github.com/mulyasalam/Spendtracker
