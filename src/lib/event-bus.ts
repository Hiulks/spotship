import { dispatchWebhooks } from "./webhooks";
import { logAutomation } from "./automations";
import type { WebhookEvent } from "./events";

export async function emitEvent(
  organizationId: string,
  event: WebhookEvent | string,
  data: Record<string, unknown>
) {
  await logAutomation(organizationId, `event:${event}`, "info", `Event emitted: ${event}`, data);
  await dispatchWebhooks(organizationId, event, data);
  return data;
}
