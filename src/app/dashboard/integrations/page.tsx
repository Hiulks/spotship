"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card, Button, EmptyState } from "@/components/ui";

export default function IntegrationsPage() {
  const [webhooks, setWebhooks] = useState<Array<{ id: string; name: string; url: string; events: string; status: string }>>([]);
  const [apiKeys, setApiKeys] = useState<Array<{ id: string; name: string; prefix: string; lastUsedAt: string | null }>>([]);
  const [cronJobs, setCronJobs] = useState<Array<{ id: string; name: string; schedule: string; action: string; status: string }>>([]);
  const [newKey, setNewKey] = useState<string | null>(null);

  async function load() {
    const [res, keys, cron] = await Promise.all([
      fetch("/api/resources").then((r) => r.json()),
      fetch("/api/api-keys").then((r) => r.json()),
      fetch("/api/cron").then((r) => r.json()),
    ]);
    setWebhooks(res.webhooks);
    setApiKeys(keys);
    setCronJobs(cron);
  }

  useEffect(() => { load(); }, []);

  async function createWebhook() {
    const url = prompt("Webhook URL (e.g. http://localhost:4000/webhook):");
    if (!url) return;
    await fetch("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "webhook",
        name: "Middleware Integration",
        url,
        events: ["lead.created", "form.submitted", "payment.received", "appointment.created", "workflow.completed", "tag.added"],
      }),
    });
    load();
  }

  async function createApiKey() {
    const name = prompt("API key name:");
    if (!name) return;
    const res = await fetch("/api/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    setNewKey(data.key);
    load();
  }

  async function createCronJob() {
    await fetch("/api/cron", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Hourly Backup", schedule: "hourly", action: "backup" }),
    });
    load();
  }

  return (
    <div>
      <PageHeader title="API, Webhooks & Cron" description="REST API v1, outbound webhooks, scheduled jobs" action={<Button onClick={createWebhook}>Add Webhook</Button>} />

      <Card className="mb-8">
        <h3 className="font-medium text-white">REST API v1 — GET / POST / PUT / DELETE</h3>
        <p className="mt-2 text-sm text-slate-400">Use session cookie or <code className="text-indigo-400">Authorization: Bearer ss_...</code></p>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-400">
{`# List contacts
curl ${typeof window !== "undefined" ? window.location.origin : ""}/api/v1/contacts -H "Authorization: Bearer YOUR_KEY"

# Create contact
curl -X POST .../api/v1/contacts -H "Authorization: Bearer YOUR_KEY" \\
  -d '{"email":"lead@example.com","firstName":"Jane"}'

# Update opportunity stage
curl -X PUT .../api/v1/opportunities/ID -H "Authorization: Bearer YOUR_KEY" \\
  -d '{"stageId":"STAGE_ID"}'

# Public form (no auth)
curl -X POST .../api/public/demo/forms/contact \\
  -d '{"email":"lead@example.com","first_name":"Jane","phone":"+15551234567"}'`}
        </pre>
        <p className="mt-2 text-xs text-slate-500">Resources: contacts, companies, tasks, notes, funnels, forms, pipelines, opportunities, workflows, products, invoices, courses, memberships, webhooks, cron-jobs, snapshots</p>
      </Card>

      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-lg font-medium text-white">API Keys</h2>
        <Button variant="secondary" onClick={createApiKey}>Generate Key</Button>
      </div>
      {newKey && (
        <Card className="mb-4 border-green-800 bg-green-950/20">
          <p className="text-sm text-green-300">Save this key now — it won&apos;t be shown again:</p>
          <code className="mt-2 block break-all text-green-400">{newKey}</code>
        </Card>
      )}
      {apiKeys.map((k) => (
        <Card key={k.id} className="mb-2">
          <span className="text-white">{k.name}</span>
          <code className="ml-2 text-xs text-slate-500">{k.prefix}...</code>
        </Card>
      ))}

      <div className="mb-4 mt-8 flex items-center justify-between">
        <h2 className="text-lg font-medium text-white">Cron Jobs</h2>
        <Button variant="secondary" onClick={createCronJob}>Add Cron Job</Button>
      </div>
      <p className="mb-4 text-sm text-slate-500">Run worker: <code className="text-indigo-400">npm run cron</code></p>
      {cronJobs.length === 0 ? (
        <EmptyState title="No cron jobs" description="Scheduled backups, syncs, and cleanups" />
      ) : (
        cronJobs.map((j) => (
          <Card key={j.id} className="mb-2">
            <span className="text-white">{j.name}</span>
            <span className="ml-2 text-sm text-slate-500">{j.schedule} → {j.action}</span>
          </Card>
        ))
      )}

      <h2 className="mb-4 mt-8 text-lg font-medium text-white">Webhooks (outbound events)</h2>
      <p className="mb-4 text-sm text-slate-500">Events: lead.created, form.submitted, payment.received, appointment.created, pipeline.changed, tag.added, workflow.completed</p>
      {webhooks.length === 0 ? (
        <EmptyState title="No webhooks" description="Point to middleware-example/server.js for testing" />
      ) : (
        webhooks.map((w) => (
          <Card key={w.id} className="mb-2">
            <div className="font-medium text-white">{w.name}</div>
            <code className="text-xs text-indigo-400">{w.url}</code>
          </Card>
        ))
      )}
    </div>
  );
}
