import { prisma } from "./db";
import { parseJson } from "./utils";
import crypto from "crypto";

export async function dispatchWebhooks(
  organizationId: string,
  event: string,
  payload: Record<string, unknown>
) {
  const webhooks = await prisma.webhook.findMany({
    where: { organizationId, status: "active" },
  });

  const results = [];

  for (const webhook of webhooks) {
    const events = parseJson<string[]>(webhook.events, []);
    if (!events.includes(event) && !events.includes("*")) continue;

    const body = JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() });
    const signature = webhook.secret
      ? crypto.createHmac("sha256", webhook.secret).update(body).digest("hex")
      : undefined;

    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(signature ? { "X-SpotShip-Signature": signature } : {}),
        },
        body,
      });

      const delivery = await prisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          event,
          payload: body,
          status: response.ok ? "success" : "failed",
          response: `${response.status} ${response.statusText}`,
        },
      });
      results.push({ webhookId: webhook.id, status: delivery.status });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      await prisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          event,
          payload: body,
          status: "failed",
          response: message,
        },
      });
      results.push({ webhookId: webhook.id, status: "failed", error: message });
    }
  }

  return results;
}
