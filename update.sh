#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

git pull --ff-only
/usr/bin/pnpm install --frozen-lockfile
/usr/bin/pnpm build
/usr/bin/pnpm install --frozen-lockfile --prod
