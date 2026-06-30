export const WEBHOOK_EVENTS = [
  "lead.created",
  "contact.created",
  "contact.updated",
  "payment.received",
  "appointment.created",
  "pipeline.changed",
  "opportunity.stage_changed",
  "tag.added",
  "workflow.completed",
  "workflow.failed",
  "form.submitted",
  "survey.submitted",
  "invoice.created",
  "subscription.created",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];
