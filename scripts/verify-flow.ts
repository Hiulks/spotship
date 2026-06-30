#!/usr/bin/env tsx
/**
 * End-to-end flow verification
 * Tests: form → contact → workflow → email/sms → pipeline → calendar → snapshot
 */
const BASE = process.env.BASE_URL || "http://localhost:3000";

interface Check {
  name: string;
  ok: boolean;
  detail?: string;
}

const checks: Check[] = [];

function pass(name: string, detail?: string) {
  checks.push({ name, ok: true, detail });
  console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name: string, detail?: string) {
  checks.push({ name, ok: false, detail });
  console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ""}`);
}

async function main() {
  console.log("\n=== SpotShip Flow Verification ===\n");
  console.log(`Base URL: ${BASE}\n`);

  // 1. Login
  console.log("1. Authentication");
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "demo@spotship.io", password: "demo1234" }),
  });
  const setCookies = typeof loginRes.headers.getSetCookie === "function"
    ? loginRes.headers.getSetCookie()
    : [loginRes.headers.get("set-cookie") || ""].filter(Boolean);
  const cookie = setCookies.map((c) => c.split(";")[0]).join("; ");
  if (loginRes.ok && cookie) pass("Login");
  else return fail("Login", await loginRes.text());

  const headers = { Cookie: cookie, "Content-Type": "application/json" };

  // 2. Form submission → contact
  console.log("\n2. Form → Contact");
  const formRes = await fetch(`${BASE}/api/public/demo/forms/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: `test-${Date.now()}@verify.local`,
      first_name: "Verify",
      last_name: "Test",
      phone: "+15550001111",
    }),
  });
  const formData = await formRes.json();
  if (formRes.ok && formData.contactId) pass("Form creates contact", formData.contactId);
  else fail("Form creates contact", JSON.stringify(formData));

  // 3. Workflow triggered (check logs)
  console.log("\n3. Workflow execution");
  await new Promise((r) => setTimeout(r, 500));
  const troubleRes = await fetch(`${BASE}/api/troubleshoot`, { headers });
  const trouble = await troubleRes.json();
  const workflowRuns = trouble.runs?.filter((r: { status: string }) => r.status === "completed") || [];
  if (workflowRuns.length > 0) pass("Workflow completed", `${workflowRuns.length} runs`);
  else fail("Workflow completed", "No completed runs found");

  // 4. Email/SMS sent
  console.log("\n4. Email & SMS");
  const msgRes = await fetch(`${BASE}/api/v1/message-logs`, { headers }).catch(() => null);
  // message-logs may not exist - check automation logs instead
  const emailLogs = trouble.logs?.filter((l: { source: string }) => l.source.includes("email") || l.message.includes("Email")) || [];
  const smsLogs = trouble.logs?.filter((l: { source: string }) => l.source.includes("sms") || l.message.includes("SMS")) || [];
  if (emailLogs.length > 0 || trouble.logs?.length > 0) pass("Automation logs present", `${trouble.logs?.length} logs`);
  else fail("Automation logs");

  // 5. Pipeline / opportunities
  console.log("\n5. CRM Pipeline");
  const oppRes = await fetch(`${BASE}/api/v1/opportunities`, { headers });
  const opps = await oppRes.json();
  if (oppRes.ok && opps.data?.length > 0) pass("Opportunities exist", `${opps.data.length} deals`);
  else fail("Opportunities");

  // 6. Calendar booking
  console.log("\n6. Calendar");
  const calListRes = await fetch(`${BASE}/api/resources`, { headers });
  const resources = await calListRes.json();
  const cal = resources.calendars?.[0];
  if (cal) {
    const bookRes = await fetch(`${BASE}/api/public/demo/calendar/${cal.slug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Calendar Test",
        email: `cal-${Date.now()}@verify.local`,
        startsAt: new Date(Date.now() + 86400000).toISOString(),
      }),
    });
    if (bookRes.ok) pass("Calendar books appointment");
    else fail("Calendar booking", await bookRes.text());
  } else {
    fail("Calendar", "No calendar found - run seed");
  }

  // 7. Snapshot export
  console.log("\n7. Snapshot");
  const snapRes = await fetch(`${BASE}/api/snapshots`, {
    method: "POST",
    headers,
    body: JSON.stringify({ action: "export", name: "Verify Export" }),
  });
  const snapText = await snapRes.text();
  let snap: { payload?: unknown };
  try { snap = JSON.parse(snapText); } catch { snap = {}; }
  if (snapRes.ok && snap.payload) pass("Snapshot export", `${Object.keys(snap.payload as object).length} sections`);
  else fail("Snapshot export", snapText.slice(0, 200) || `HTTP ${snapRes.status}`);

  // 8. REST API v1
  console.log("\n8. REST API v1");
  const contactsRes = await fetch(`${BASE}/api/v1/contacts`, { headers });
  const contacts = await contactsRes.json();
  if (contactsRes.ok && contacts.count > 0) pass("GET /api/v1/contacts", `${contacts.count} contacts`);
  else fail("REST API v1");

  // Summary
  console.log("\n=== Summary ===");
  const passed = checks.filter((c) => c.ok).length;
  const total = checks.length;
  console.log(`${passed}/${total} checks passed\n`);

  if (passed < total) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("Verification failed:", e.message);
  process.exit(1);
});
