/**
 * SpotShip Middleware Example
 * Receives webhooks from SpotShip and executes custom logic.
 *
 * Run: node middleware-example/server.js
 * Configure webhook URL: http://localhost:4000/webhook
 */
const http = require("http");
const PORT = 4000;

const handlers = {
  "lead.created": async (data) => {
    console.log("[HANDLER] New lead:", data.data?.contact?.email);
    // Example: send to Slack, create ticket, etc.
  },
  "payment.received": async (data) => {
    console.log("[HANDLER] Payment:", data.data);
  },
  "appointment.created": async (data) => {
    console.log("[HANDLER] Appointment:", data.data);
  },
  "workflow.completed": async (data) => {
    console.log("[HANDLER] Workflow done:", data.data);
  },
};

const server = http.createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/webhook") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const payload = JSON.parse(body);
        console.log(`\n[WEBHOOK] Event: ${payload.event}`);
        const handler = handlers[payload.event];
        if (handler) await handler(payload);
        else console.log("[WEBHOOK] Unhandled event:", payload.event);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  if (req.url === "/health") {
    res.writeHead(200);
    res.end("ok");
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`SpotShip middleware listening on http://localhost:${PORT}`);
  console.log(`Webhook endpoint: http://localhost:${PORT}/webhook`);
});
