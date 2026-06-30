import { PrismaClient } from "@prisma/client";
import type { SessionUser } from "./auth";

type PrismaModel = {
  findMany: (args?: object) => Promise<unknown[]>;
  findFirst: (args?: object) => Promise<unknown | null>;
  findUnique: (args?: object) => Promise<unknown | null>;
  create: (args: object) => Promise<unknown>;
  update: (args: object) => Promise<unknown>;
  delete: (args: object) => Promise<unknown>;
  count: (args?: object) => Promise<number>;
};

export interface ResourceConfig {
  model: PrismaModel;
  orgField?: string;
  orgVia?: string;
  include?: object;
  createFields?: string[];
  updateFields?: string[];
  transformCreate?: (body: Record<string, unknown>, orgId: string) => Record<string, unknown>;
}

export function buildResourceRegistry(prisma: PrismaClient): Record<string, ResourceConfig> {
  return {
    contacts: {
      model: prisma.contact as unknown as PrismaModel,
      orgField: "organizationId",
      createFields: ["email", "firstName", "lastName", "phone", "tags", "customData", "source", "companyId"],
      updateFields: ["firstName", "lastName", "phone", "tags", "customData", "companyId"],
    },
    companies: {
      model: prisma.company as unknown as PrismaModel,
      orgField: "organizationId",
      createFields: ["name", "website", "industry"],
      updateFields: ["name", "website", "industry"],
    },
    locations: {
      model: prisma.location as unknown as PrismaModel,
      orgField: "organizationId",
      createFields: ["name", "address", "city", "country", "timezone"],
      updateFields: ["name", "address", "city", "country", "timezone"],
    },
    teams: {
      model: prisma.team as unknown as PrismaModel,
      orgField: "organizationId",
      createFields: ["name", "members"],
      updateFields: ["name", "members"],
    },
    tasks: {
      model: prisma.task as unknown as PrismaModel,
      orgField: "organizationId",
      createFields: ["title", "description", "dueAt", "status", "priority", "contactId"],
      updateFields: ["title", "description", "dueAt", "status", "priority", "contactId"],
    },
    notes: {
      model: prisma.note as unknown as PrismaModel,
      orgField: "organizationId",
      createFields: ["content", "contactId"],
      updateFields: ["content", "contactId"],
    },
    tags: {
      model: prisma.tag as unknown as PrismaModel,
      orgField: "organizationId",
      createFields: ["name", "color"],
      updateFields: ["name", "color"],
    },
    "custom-fields": {
      model: prisma.customField as unknown as PrismaModel,
      orgField: "organizationId",
      createFields: ["name", "key", "type"],
      updateFields: ["name", "type"],
    },
    funnels: {
      model: prisma.funnel as unknown as PrismaModel,
      orgField: "organizationId",
      include: { pages: true },
      createFields: ["name", "slug", "status", "customCss", "customHtml", "customJs"],
      updateFields: ["name", "slug", "status", "customCss", "customHtml", "customJs"],
    },
    websites: {
      model: prisma.website as unknown as PrismaModel,
      orgField: "organizationId",
      include: { pages: true },
      createFields: ["name", "slug", "status", "customCss", "customHtml", "customJs"],
      updateFields: ["name", "slug", "status", "customCss", "customHtml", "customJs"],
    },
    forms: {
      model: prisma.form as unknown as PrismaModel,
      orgField: "organizationId",
      include: { fields: true },
      createFields: ["name", "slug", "settings", "thankYouMsg"],
      updateFields: ["name", "slug", "settings", "thankYouMsg"],
    },
    surveys: {
      model: prisma.survey as unknown as PrismaModel,
      orgField: "organizationId",
      include: { questions: true },
      createFields: ["name", "slug", "settings"],
      updateFields: ["name", "slug", "settings"],
    },
    calendars: {
      model: prisma.calendar as unknown as PrismaModel,
      orgField: "organizationId",
      include: { slots: true },
      createFields: ["name", "slug", "duration", "settings"],
      updateFields: ["name", "slug", "duration", "settings"],
    },
    appointments: {
      model: prisma.appointment as unknown as PrismaModel,
      orgVia: "calendar",
      include: { calendar: true, contact: true },
      createFields: ["calendarId", "contactId", "name", "email", "phone", "startsAt", "endsAt", "status"],
      updateFields: ["name", "email", "phone", "startsAt", "endsAt", "status"],
    },
    pipelines: {
      model: prisma.pipeline as unknown as PrismaModel,
      orgField: "organizationId",
      include: { stages: true },
      createFields: ["name"],
      updateFields: ["name"],
    },
    opportunities: {
      model: prisma.opportunity as unknown as PrismaModel,
      include: { contact: true, stage: true },
      createFields: ["contactId", "stageId", "title", "value", "status"],
      updateFields: ["stageId", "title", "value", "status"],
    },
    workflows: {
      model: prisma.workflow as unknown as PrismaModel,
      orgField: "organizationId",
      include: { steps: true },
      createFields: ["name", "trigger", "triggerConfig", "status"],
      updateFields: ["name", "trigger", "triggerConfig", "status"],
    },
    products: {
      model: prisma.product as unknown as PrismaModel,
      orgField: "organizationId",
      createFields: ["name", "description", "price", "currency", "interval", "status"],
      updateFields: ["name", "description", "price", "currency", "interval", "status"],
    },
    invoices: {
      model: prisma.invoice as unknown as PrismaModel,
      orgField: "organizationId",
      createFields: ["contactEmail", "amount", "currency", "status", "dueAt", "items"],
      updateFields: ["amount", "currency", "status", "dueAt", "items"],
    },
    courses: {
      model: prisma.course as unknown as PrismaModel,
      orgField: "organizationId",
      createFields: ["name", "description", "modules", "status"],
      updateFields: ["name", "description", "modules", "status"],
    },
    memberships: {
      model: prisma.membershipPlan as unknown as PrismaModel,
      orgField: "organizationId",
      createFields: ["courseId", "name", "contactEmail", "status", "expiresAt"],
      updateFields: ["name", "status", "expiresAt"],
    },
    webhooks: {
      model: prisma.webhook as unknown as PrismaModel,
      orgField: "organizationId",
      createFields: ["name", "url", "events", "secret", "status"],
      updateFields: ["name", "url", "events", "secret", "status"],
    },
    "cron-jobs": {
      model: prisma.cronJob as unknown as PrismaModel,
      orgField: "organizationId",
      createFields: ["name", "schedule", "action", "config", "status"],
      updateFields: ["name", "schedule", "action", "config", "status"],
    },
    snapshots: {
      model: prisma.snapshot as unknown as PrismaModel,
      orgField: "organizationId",
      createFields: ["name", "description", "payload", "isTemplate", "version"],
      updateFields: ["name", "description", "isTemplate"],
    },
  };
}

export function pickFields(body: Record<string, unknown>, fields?: string[]) {
  if (!fields) return body;
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    if (body[f] !== undefined) out[f] = body[f];
  }
  return out;
}

export type ApiContext = SessionUser & { authMethod: "session" | "api_key" };
