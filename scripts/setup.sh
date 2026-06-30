#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== SpotShip Setup ==="

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

echo "Installing dependencies..."
npm install

echo "Setting up database..."
npx prisma db push --accept-data-loss 2>/dev/null || npx prisma db push
npm run db:seed

echo "Building..."
npm run build

echo ""
echo "=== Setup Complete ==="
echo "Start:  npm run dev"
echo "Login:  demo@spotship.io / demo1234"
echo "Verify: npm run verify"
echo "Cron:   npm run cron (in separate terminal)"
echo ""
