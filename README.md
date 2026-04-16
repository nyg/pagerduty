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
- **Environment variables** (`.env.local`):
  - `PAGERDUTY_API_TOKEN` — Server-side API token (not exposed to the browser). When set, the dashboard works without configuring the token in the Settings page.
  - `PAGERDUTY_TEAM_ID` — Server-side team ID. Used as fallback when no team is configured in the Settings page.
  - `NEXT_PUBLIC_PAGERDUTY_TEAM_ID` — Client-side team ID (exposed to the browser, used for pre-filling the Settings page).
  - `NEXT_PUBLIC_NGROK_URL` — Client-side ngrok URL.
  - `NEXT_PUBLIC_POLL_INTERVAL` — Client-side poll interval in seconds (default: 30).

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

2. Clone the repository directly into `/opt/pagerduty`:

   ```bash
   sudo -u pagerduty git clone https://github.com/nyg/pagerduty.git /opt/pagerduty
   ```

3. Create a project-level `.npmrc` and cache directory so the `pagerduty` user can run npm without access to your personal `~/.npmrc`:

   ```bash
   sudo mkdir -p /var/cache/npm-pagerduty
   sudo chown pagerduty:pagerduty /var/cache/npm-pagerduty

   printf 'cafile=\ncache=/var/cache/npm-pagerduty\n' | sudo -u pagerduty tee /opt/pagerduty/.npmrc > /dev/null
   ```

4. Install dependencies and build:

   ```bash
   cd /opt/pagerduty
   sudo -u pagerduty /usr/bin/npm ci
   sudo -u pagerduty /usr/bin/npm run build
   sudo -u pagerduty /usr/bin/npm ci --omit=dev
   ```

5. Copy your environment file:

   ```bash
   sudo cp .env.local /opt/pagerduty/.env.local
   sudo chown pagerduty:pagerduty /opt/pagerduty/.env.local
   ```

6. Install and start the service:

   ```bash
   sudo cp pagerduty.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable pagerduty
   sudo systemctl start pagerduty
   ```

7. Check status and logs:

   ```bash
   sudo systemctl status pagerduty
   journalctl -u pagerduty -f
   ```

8. Update the app later:

   ```bash
   cd /opt/pagerduty
   sudo -u pagerduty ./update.sh
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
