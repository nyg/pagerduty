# PagerDuty Incident Dashboard

A real-time dashboard for monitoring PagerDuty incidents, built with Next.js, shadcn/ui, and Tailwind CSS.

## Features

- **Incident monitoring** — View triggered, acknowledged, and resolved incidents for your team
- **Auto-refresh** — Configurable polling interval (default 30s) with countdown timer
- **Real-time webhooks** — Optional ngrok-based webhook mode for instant updates via SSE
- **Browser notifications** — Get notified of new incidents even when the tab is in the background
- **Expandable alerts** — Drill into alerts for each incident on demand
- **Pagination** — 30 incidents per page with navigation controls
- **Dark/light mode** — Theme toggle with system preference detection
- **Settings page** — Configure API token, team, polling interval, and ngrok URL

## Getting Started

1. Install dependencies: `npm install`
2. Configure environment (optional): `cp .env.local.example .env.local`
3. Run the development server: `npm run dev`
4. Open http://localhost:3000 and configure your settings.

## Configuration

Settings can be configured via:

- **Settings page** (`/settings`) — API token, team, poll interval, ngrok URL (persisted in localStorage)
- **Environment variables** — `PAGERDUTY_API_TOKEN`, `NEXT_PUBLIC_PAGERDUTY_TEAM_ID`, etc.

## Webhook Mode

1. Start an ngrok tunnel: `ngrok http 3000`
2. Enter the ngrok URL in Settings
3. The app auto-creates a PagerDuty webhook subscription
4. Incidents stream in real-time via Server-Sent Events

## Linux Service (systemd)

A systemd unit file is included to run the dashboard as a service on Linux.

1. Create a dedicated user and install directory:

   ```bash
   sudo useradd -r -s /usr/sbin/nologin pagerduty
   sudo mkdir -p /opt/pagerduty
   sudo chown pagerduty:pagerduty /opt/pagerduty
   ```

2. Clone the repository directly into `/opt/pagerduty` and build it:

   ```bash
   sudo -u pagerduty git clone https://github.com/nyg/pagerduty.git /opt/pagerduty
   cd /opt/pagerduty
   sudo -u pagerduty npm ci
   sudo -u pagerduty npm run build
   sudo -u pagerduty npm prune --omit=dev
   ```

3. Copy your environment file:

   ```bash
   sudo cp .env.local /opt/pagerduty/.env.local
   sudo chown pagerduty:pagerduty /opt/pagerduty/.env.local
   ```

4. Install and start the service:

   ```bash
   sudo cp pagerduty.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable pagerduty
   sudo systemctl start pagerduty
   ```

5. Check status and logs:

   ```bash
   sudo systemctl status pagerduty
   journalctl -u pagerduty -f
   ```

6. Update the app later:

   ```bash
   cd /opt/pagerduty
   sudo -u pagerduty git pull --ff-only
   sudo -u pagerduty npm ci
   sudo -u pagerduty npm run build
   sudo -u pagerduty npm prune --omit=dev
   sudo systemctl restart pagerduty
   ```

   If `git pull --ff-only` fails, resolve local changes or reset the checkout before retrying.

## Testing

`npm test`

## Tech Stack

- [Next.js](https://nextjs.org/) (App Router)
- [shadcn/ui](https://ui.shadcn.com/) (Radix UI + Tailwind CSS)
- [TypeScript](https://www.typescriptlang.org/)
- [Vitest](https://vitest.dev/) for testing
