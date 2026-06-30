#!/usr/bin/env tsx
/**
 * SpotShip Dry-Run Test Suite
 * Non-destructive checks + minimal write tests
 * Run: npm run test:dry-run
 */
const BASE = process.env.BASE_URL || "http://localhost:3000";

interface Result { group: string; name: string; ok: boolean; detail?: string }

const results: Result[] = [];
let cookie = "";

function record(group: string, name: string, ok: boolean, detail?: string) {
  results.push({ group, name, ok, detail });
  const icon = ok ? "✓" : "✗";
  console.log(`  ${icon} ${name}${detail ? ` — ${detail}` : ""}`);
}

async function req(path: string, opts: RequestInit = {}) {
  const headers: Record<string, string> = { ...(opts.headers as Record<string, string>) };
  if (cookie) headers.Cookie = cookie;
  return fetch(`${BASE}${path}`, { ...opts, headers });
}

async function testStaticPages() {
  console.log("\n[1] Static & Public Pages");
  const pages = ["/login", "/register", "/form/demo/contact", "/funnel/demo/lead-gen", "/calendar/demo/discovery-call"];
  for (const p of pages) {
    const r = await req(p);
    record("pages", `GET ${p}`, r.status === 200, `HTTP ${r.status}`);
  }
}

async function testAuth() {
  console.log("\n[2] Authentication");
  const r = await req("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "demo@spotship.io", password: "demo1234" }),
  });
  const cookies = typeof r.headers.getSetCookie === "function" ? r.headers.getSetCookie() : [];
  cookie = cookies.map((c) => c.split(";")[0]).join("; ");
  record("auth", "POST /api/auth/login", r.ok && cookie.length > 0);

  const bad = await req("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "wrong@test.com", password: "bad" }),
  });
  record("auth", "Reject bad credentials", bad.status === 401);
}

async function testDashboardAPI() {
  console.log("\n[3] Dashboard APIs (authenticated)");
  const endpoints = [
    "/api/dashboard",
    "/api/funnels",
    "/api/forms",
    "/api/contacts",
    "/api/pipelines",
    "/api/opportunities",
    "/api/workflows",
    "/api/products",
    "/api/snapshots",
    "/api/troubleshoot",
    "/api/resources",
    "/api/affiliates",
    "/api/settings/white-label",
    "/api/cron",
    "/api/api-keys",
  ];
  for (const e of endpoints) {
    const r = await req(e);
    record("api", `GET ${e}`, r.ok, `HTTP ${r.status}`);
  }
}

async function testV1API() {
  console.log("\n[4] REST API v1");
  const resources = [
    "contacts", "companies", "tasks", "notes", "tags", "funnels", "forms",
    "pipelines", "opportunities", "workflows", "products", "calendars", "webhooks", "cron-jobs",
  ];
  for (const res of resources) {
    const r = await req(`/api/v1/${res}`);
    const data = await r.json().catch(() => ({}));
    record("v1", `GET /api/v1/${res}`, r.ok && "data" in data, `count=${(data as { count?: number }).count ?? "?"}`);
  }

  // Unauthorized should 401
  const noAuth = await fetch(`${BASE}/api/v1/contacts`);
  record("v1", "Reject unauthenticated", noAuth.status === 401);
}

async function testPublicAPI() {
  console.log("\n[5] Public APIs (dry-run write)");
  const email = `dryrun-${Date.now()}@test.local`;
  const formR = await req("/api/public/demo/forms/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, first_name: "Dry", last_name: "Run", phone: "+15550009999" }),
  });
  const formData = await formR.json().catch(() => ({}));
  record("public", "POST form → contact", formR.ok && !!(formData as { contactId?: string }).contactId);

  const calR = await req("/api/public/demo/calendar/discovery-call", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Dry Run",
      email: `cal-${Date.now()}@test.local`,
      startsAt: new Date(Date.now() + 172800000).toISOString(),
    }),
  });
  record("public", "POST calendar booking", calR.ok, `HTTP ${calR.status}`);

  const calGet = await req("/api/public/demo/calendar/discovery-call");
  record("public", "GET calendar info", calGet.ok);
}

async function testSnapshotDryRun() {
  console.log("\n[6] Snapshot (export only — dry-run)");
  const r = await req("/api/snapshots", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "export", name: "Dry Run Export" }),
  });
  const data = await r.json().catch(() => ({}));
  const payload = (data as { payload?: Record<string, unknown> }).payload;
  record("snapshot", "Export snapshot", r.ok && !!payload, payload ? `${Object.keys(payload).length} sections` : `HTTP ${r.status}`);
}

async function testMessagingOutbox() {
  console.log("\n[7] Storage / Outbox");
  const fs = await import("fs");
  const path = await import("path");
  const outbox = path.join(process.cwd(), "data", "outbox");
  const exists = fs.existsSync(outbox);
  record("storage", "Outbox directory exists", exists);
  if (exists) {
    const files = fs.readdirSync(outbox).filter((f) => f.endsWith(".json"));
    record("storage", "Email/SMS outbox files", files.length > 0, `${files.length} files`);
  }
  const dbPath = path.join(process.cwd(), "prisma", "dev.db");
  record("storage", "SQLite database exists", fs.existsSync(dbPath));
}

async function testBuildArtifact() {
  console.log("\n[8] Build artifact");
  const fs = await import("fs");
  const path = await import("path");
  const nextDir = path.join(process.cwd(), ".next");
  record("build", ".next build output", fs.existsSync(nextDir));
}

async function main() {
  console.log("=== SpotShip Dry-Run Test Suite ===");
  console.log(`Target: ${BASE}\n`);

  try {
    await testStaticPages();
    await testAuth();
    await testDashboardAPI();
    await testV1API();
    await testPublicAPI();
    await testSnapshotDryRun();
    await testMessagingOutbox();
    await testBuildArtifact();
  } catch (e) {
    console.error("\nFatal:", e instanceof Error ? e.message : e);
    process.exit(1);
  }

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);

  console.log(`\n=== Results: ${passed}/${results.length} passed ===`);
  if (failed.length) {
    console.log("\nFailed:");
    failed.forEach((f) => console.log(`  [${f.group}] ${f.name}: ${f.detail || "failed"}`));
    process.exit(1);
  }
  console.log("\nAll dry-run tests passed. Ready for use.\n");
}

main();
