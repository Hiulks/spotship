# SpotShip

**Ship complete business systems to clients in minutes.**

Self-hosted white-label platform: funnels, CRM, automations, payments, snapshots, REST API, webhooks, and cron jobs.

## Repositories (cloud backup)

| Repo | Purpose |
|------|---------|
| [Hiulks/spotship](https://github.com/Hiulks/spotship) | Main platform |
| [Hiulks/spotship-middleware](https://github.com/Hiulks/spotship-middleware) | Webhook receiver |
| [Hiulks/spotship-agency-toolkit](https://github.com/Hiulks/spotship-agency-toolkit) | Deploy scripts + starter snapshot |

## One-Command Setup

```bash
cd /home/cody/spotship
npm run setup        # install + db + seed + build
npm run dev          # http://localhost:3000
npm run verify       # 8/8 automated flow tests
```

**Demo login:** `demo@spotship.io` / `demo1234`

## Agency Workflow

```
UI (build) → Test (verify) → Snapshot (replicate) → API (automate) → Webhooks (events) → Middleware (custom logic) → Cron (scheduled)
```

### 1. Build in UI
Dashboard modules: Funnels, Websites, Forms, Surveys, Calendars, CRM Pipeline, Workflows, Email/SMS Sequences, AI Agents, Payments, SaaS, White Label, Affiliates.

### 2. Test Everything
```bash
npm run verify
```
Tests: form → contact → workflow → email/SMS → pipeline → calendar → snapshot → REST API.

### 3. Snapshot (1-click)
Dashboard → **Snapshots** → Export / Backup / Clone / Import JSON.

### 4. REST API v1 (GET / POST / PUT / DELETE)
Generate an API key in **Integrations**, then:

```bash
# List contacts
curl http://localhost:3000/api/v1/contacts \
  -H "Authorization: Bearer ss_YOUR_KEY"

# Create contact
curl -X POST http://localhost:3000/api/v1/contacts \
  -H "Authorization: Bearer ss_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"lead@example.com","firstName":"Jane"}'

# Move opportunity
curl -X PUT http://localhost:3000/api/v1/opportunities/ID \
  -H "Authorization: Bearer ss_YOUR_KEY" \
  -d '{"stageId":"STAGE_ID"}'
```

**Resources:** contacts, companies, tasks, notes, tags, funnels, forms, pipelines, opportunities, workflows, products, invoices, courses, memberships, webhooks, cron-jobs, snapshots

### 5. Webhooks (outbound events)
Configure in **Integrations**. Events fired automatically:

| Event | Trigger |
|-------|---------|
| `lead.created` | New form submission |
| `form.submitted` | Form completed |
| `payment.received` | Stripe payment |
| `appointment.created` | Calendar booking |
| `pipeline.changed` | Opportunity moved |
| `opportunity.stage_changed` | Stage update |
| `tag.added` | Workflow adds tag |
| `workflow.completed` | Automation finished |
| `workflow.failed` | Automation error |

### 6. Middleware (your server)
```bash
npm run middleware   # http://localhost:4000/webhook
```
Point a SpotShip webhook to `http://localhost:4000/webhook`. Extend `middleware-example/server.js` for Slack, Discord, ERP, etc.

### 7. Cron Jobs
```bash
npm run cron         # runs scheduled jobs every 60s
```
Built-in actions: `backup`, `sync_contacts`, `cleanup_logs`, `export_snapshot`, `webhook_ping`

## Public URLs

| Type | URL |
|------|-----|
| Form | `/form/demo/contact` |
| Funnel | `/funnel/demo/lead-gen` |
| Calendar | `/calendar/demo/discovery-call` |

## Email & SMS

Without credentials, messages are **simulated** and logged to `data/outbox/`.

Optional `.env`:
```
SMTP_HOST=smtp.example.com
SMTP_USER=...
SMTP_PASS=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM=+1...
```

## Stripe

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```
Webhook endpoint: `POST /api/stripe/webhook`

## Docker

```bash
docker compose up -d
```

## Backup

Pre-expansion backup saved at:
`/home/cody/backups/spotship-20260630-092309`

## Project Structure

```
src/lib/
  snapshots.ts      # Export/import/clone engine
  automations.ts    # Workflow execution
  messaging.ts      # Email + SMS delivery
  event-bus.ts      # Webhook event emitter
  api-v1.ts         # REST resource registry
  cron.ts           # Scheduled job runner
scripts/
  setup.sh          # One-command install
  verify-flow.ts    # E2E tests
  cron-worker.ts    # Background cron
middleware-example/ # Webhook receiver template
```

## License

MIT
