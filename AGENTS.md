# Agent Instructions

## Project Overview

PagerDuty Incident Dashboard — a real-time dashboard for monitoring PagerDuty incidents, built with Next.js (App Router), shadcn/ui (Radix UI + Tailwind CSS), and TypeScript.

## Tech Stack

- **Framework:** Next.js 16 with App Router (`src/app/`)
- **UI:** shadcn/ui components (`src/components/ui/`), Tailwind CSS v4
- **Language:** TypeScript (strict mode)
- **Testing:** Vitest + jsdom + Testing Library + MSW for mocking
- **Linting:** ESLint with the shared `@nyg/eslint-config` (base + Next.js with TypeScript)

## Commands

- `pnpm dev` — Start development server
- `pnpm build` — Production build
- `pnpm start` — Start production server
- `pnpm test` — Run tests (Vitest)
- `pnpm lint` — Run ESLint

## Project Structure

```
src/
├── app/              # Next.js App Router pages and API routes
│   ├── api/          # API route handlers
│   │   ├── config/   # Server-side config status endpoint
│   │   ├── incidents/ # Incident listing and alert details
│   │   ├── settings/ # Webhook subscription management
│   │   └── teams/    # Team listing
│   ├── settings/     # Settings page
│   ├── layout.tsx    # Root layout
│   └── page.tsx      # Home page
├── components/       # React components
│   └── ui/           # shadcn/ui primitives
├── contexts/         # React context providers
├── hooks/            # Custom React hooks
├── lib/              # Utility functions and PagerDuty API client
│   ├── pagerduty.ts  # PagerDuty API helpers
│   ├── types.ts      # Shared type definitions
│   └── utils.ts      # General utilities
└── __tests__/        # Test files
```

## Conventions

- Use the `@/` path alias for imports (maps to `src/`).
- Place new UI primitives in `src/components/ui/`, feature components in `src/components/`.
- Place shared types in `src/lib/types.ts`.
- Tests go in `src/__tests__/` and use Vitest with Testing Library.
- The systemd service file (`pagerduty.service`) assumes pnpm is available at `/usr/bin/pnpm`.
- Deployment uses a project-level `.npmrc` (with `cafile=`), and the `pagerduty` system user has a home directory (`/var/lib/pagerduty`) for the pnpm store and cache. Run pnpm as that user with `sudo -H -u pagerduty`.
- Use `update.sh` to pull and rebuild the production deployment.
- Server-side env var `PAGERDUTY_API_TOKEN` is used by API routes and is not exposed to the browser. The `/api/config` endpoint lets the client know whether a server token is available.
