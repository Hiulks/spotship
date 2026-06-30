# SpotShip — Run & Test Guide

## Quick Start (first time)

```bash
cd /home/cody/spotship
cp .env.example .env          # optional — works without Stripe/SMTP
npm run setup                 # install + database + seed + build
npm run dev                   # → http://localhost:3000
```

**Login:** `demo@spotship.io` / `demo1234`

---

## Automated Tests (run these before selling)

```bash
# 45 checks: pages, APIs, DB, storage, snapshots
npm run test:dry-run

# 8 checks: full business flow (form → workflow → email → calendar → snapshot)
npm run verify

# Both suites
npm run test:all
```

Run `test:dry-run` **twice** to confirm stability (writes test contacts each run — safe).

---

## Manual UI Checklist

Open http://localhost:3000 and sign in. Click each sidebar item:

| Page | What to test |
|------|----------------|
| **Overview** | Stats load, quick actions work |
| **Snapshots** | Export → downloads JSON; Backup saves |
| **Funnels** | List shows "Lead Generation"; Preview opens `/funnel/demo/lead-gen` |
| **Forms** | Shows Contact Form; open `/form/demo/contact`, submit |
| **CRM Pipeline** | Kanban columns visible; drag stage dropdown on deal |
| **Workflows** | "New Lead Automation" active; Pause/Activate toggles |
| **Email & SMS** | Click Add on sequences |
| **Calendars** | Book link → `/calendar/demo/discovery-call` |
| **Contacts** | Table shows leads from form tests |
| **Integrations** | Generate API Key; Add Webhook |
| **Troubleshoot** | Logs show workflow/email events |
| **White Label / SaaS** | Edit fields, Save |

---

## Public URLs (no login)

| URL | Test |
|-----|------|
| http://localhost:3000/form/demo/contact | Submit form with email |
| http://localhost:3000/funnel/demo/lead-gen | Landing page renders |
| http://localhost:3000/calendar/demo/discovery-call | Book appointment |

---

## API Tests (curl)

```bash
# Login (save cookie)
curl -c /tmp/ss.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@spotship.io","password":"demo1234"}'

# List contacts via REST v1
curl -b /tmp/ss.txt http://localhost:3000/api/v1/contacts

# Public form (no auth)
curl -X POST http://localhost:3000/api/public/demo/forms/contact \
  -H "Content-Type: application/json" \
  -d '{"email":"you@test.com","first_name":"Test","phone":"+15551234567"}'
```

---

## Background Services

```bash
# Terminal 1 — app
npm run dev

# Terminal 2 — cron jobs (backups, sync)
npm run cron

# Terminal 3 — webhook middleware (optional)
npm run middleware
# Then add webhook in Integrations → http://localhost:4000/webhook
```

---

## Production

```bash
npm run build
npm start

# Or Docker
docker compose up -d
```

Set in `.env` for live mode:
- `JWT_SECRET` — strong random string
- `SMTP_*` — real email delivery
- `TWILIO_*` — real SMS
- `STRIPE_*` — real payments

Without these, email/SMS go to `data/outbox/` (simulated) and payments run in demo mode.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Port 3000 in use | `kill $(lsof -t -i:3000)` then `npm run dev` |
| Snapshot 500 | Restart dev server after schema changes: `npx prisma generate && npm run dev` |
| Empty dashboard | Run `npm run db:seed` |
| API 401 | Re-login or generate API key in Integrations |

---

## Test Results (last run)

- `test:dry-run`: **45/45 passed**
- `verify`: **8/8 passed**
