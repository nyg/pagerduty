#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

git pull --ff-only
/usr/bin/npm ci
/usr/bin/npm run build
/usr/bin/npm ci --omit=dev
