import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { verifyApiKey } from "@/lib/api-keys";
import { buildResourceRegistry, pickFields, type ApiContext } from "@/lib/api-v1";
import { emitEvent } from "@/lib/event-bus";
import { triggerWorkflows } from "@/lib/automations";

const registry = buildResourceRegistry(prisma);

async function resolveAuth(req: NextRequest): Promise<ApiContext | null> {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const key = authHeader.slice(7);
    const record = await verifyApiKey(key);
    if (record) {
      return {
        id: "api-key",
        email: "api@spotship.local",
        name: record.name,
        organizationId: record.organizationId,
        organizationSlug: "",
        role: "api",
        authMethod: "api_key",
      };
    }
  }
  const session = await getSession();
  if (session) return { ...session, authMethod: "session" };
  return null;
}

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

async function listResource(resource: string, ctx: ApiContext) {
  const config = registry[resource];
  if (!config) return null;

  if (config.orgField) {
    const noOrder = ["tags", "custom-fields", "pipelines", "teams", "products"];
    const orderBy = noOrder.includes(resource) ? undefined : ({ createdAt: "desc" } as object);
    return config.model.findMany({
      where: { [config.orgField]: ctx.organizationId },
      include: config.include,
      ...(orderBy ? { orderBy } : {}),
    });
  }

  if (resource === "opportunities") {
    return prisma.opportunity.findMany({
      where: { contact: { organizationId: ctx.organizationId } },
      include: config.include,
      orderBy: { updatedAt: "desc" },
    });
  }

  if (resource === "appointments") {
    return prisma.appointment.findMany({
      where: { calendar: { organizationId: ctx.organizationId } },
      include: config.include,
      orderBy: { startsAt: "desc" },
    });
  }

  return config.model.findMany({ include: config.include });
}

async function getResource(resource: string, id: string, ctx: ApiContext) {
  const config = registry[resource];
  if (!config) return null;

  const item = await config.model.findUnique({ where: { id }, include: config.include });
  if (!item) return null;

  if (config.orgField) {
    const record = item as Record<string, unknown>;
    if (record[config.orgField] !== ctx.organizationId) return null;
  }

  return item;
}

async function createResource(resource: string, body: Record<string, unknown>, ctx: ApiContext) {
  const config = registry[resource];
  if (!config) return null;

  const data = pickFields(body, config.createFields);
  if (config.orgField) data[config.orgField] = ctx.organizationId;

  if (data.tags && typeof data.tags !== "string") data.tags = JSON.stringify(data.tags);
  if (data.events && typeof data.events !== "string") data.events = JSON.stringify(data.events);
  if (data.items && typeof data.items !== "string") data.items = JSON.stringify(data.items);
  if (data.members && typeof data.members !== "string") data.members = JSON.stringify(data.members);
  if (data.modules && typeof data.modules !== "string") data.modules = JSON.stringify(data.modules);
  if (data.config && typeof data.config !== "string") data.config = JSON.stringify(data.config);
  if (data.triggerConfig && typeof data.triggerConfig !== "string") data.triggerConfig = JSON.stringify(data.triggerConfig);
  if (data.dueAt) data.dueAt = new Date(data.dueAt as string);
  if (data.startsAt) data.startsAt = new Date(data.startsAt as string);
  if (data.endsAt) data.endsAt = new Date(data.endsAt as string);
  if (data.expiresAt) data.expiresAt = new Date(data.expiresAt as string);

  const created = await config.model.create({ data, include: config.include });

  const eventMap: Record<string, string> = {
    contacts: "contact.created",
    opportunities: "lead.created",
    appointments: "appointment.created",
    invoices: "invoice.created",
  };
  if (eventMap[resource]) {
    await emitEvent(ctx.organizationId, eventMap[resource], { resource, id: (created as { id: string }).id, data: created });
  }

  return created;
}

async function updateResource(resource: string, id: string, body: Record<string, unknown>, ctx: ApiContext) {
  const existing = await getResource(resource, id, ctx);
  if (!existing) return null;

  const config = registry[resource];
  if (!config) return null;

  const data = pickFields(body, config.updateFields);
  if (data.dueAt) data.dueAt = new Date(data.dueAt as string);
  if (data.startsAt) data.startsAt = new Date(data.startsAt as string);
  if (data.endsAt) data.endsAt = new Date(data.endsAt as string);

  const updated = await config.model.update({ where: { id }, data, include: config.include });

  if (resource === "opportunities" && body.stageId) {
    const opp = updated as { contactId: string; id: string; contact?: { email: string } };
    await emitEvent(ctx.organizationId, "opportunity.stage_changed", { opportunityId: id, stageId: body.stageId });
    await emitEvent(ctx.organizationId, "pipeline.changed", { opportunityId: id });
    await triggerWorkflows(ctx.organizationId, "opportunity_stage_changed", {
      opportunityId: id,
      contactId: opp.contactId,
      contactEmail: opp.contact?.email,
    });
  }

  if (resource === "contacts") {
    await emitEvent(ctx.organizationId, "contact.updated", { contactId: id, data: updated });
  }

  return updated;
}

async function deleteResource(resource: string, id: string, ctx: ApiContext) {
  const existing = await getResource(resource, id, ctx);
  if (!existing) return null;
  await registry[resource].model.delete({ where: { id } });
  return { deleted: true, id };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const ctx = await resolveAuth(req);
  if (!ctx) return json({ error: "Unauthorized" }, 401);

  const { path } = await params;
  const [resource, id] = path;

  if (!registry[resource]) return json({ error: "Unknown resource", resources: Object.keys(registry) }, 404);

  if (id) {
    const item = await getResource(resource, id, ctx);
    if (!item) return json({ error: "Not found" }, 404);
    return json(item);
  }

  const items = await listResource(resource, ctx);
  return json({ data: items, count: (items as unknown[]).length });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const ctx = await resolveAuth(req);
  if (!ctx) return json({ error: "Unauthorized" }, 401);

  const { path } = await params;
  const [resource] = path;
  if (!registry[resource]) return json({ error: "Unknown resource" }, 404);

  const body = await req.json();
  const created = await createResource(resource, body, ctx);
  if (!created) return json({ error: "Create failed" }, 400);
  return json(created, 201);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const ctx = await resolveAuth(req);
  if (!ctx) return json({ error: "Unauthorized" }, 401);

  const { path } = await params;
  const [resource, id] = path;
  if (!id) return json({ error: "ID required" }, 400);

  const body = await req.json();
  const updated = await updateResource(resource, id, body, ctx);
  if (!updated) return json({ error: "Not found" }, 404);
  return json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const ctx = await resolveAuth(req);
  if (!ctx) return json({ error: "Unauthorized" }, 401);

  const { path } = await params;
  const [resource, id] = path;
  if (!id) return json({ error: "ID required" }, 400);

  const result = await deleteResource(resource, id, ctx);
  if (!result) return json({ error: "Not found" }, 404);
  return json(result);
}
