import { prisma } from "./db";
import { parseJson } from "./utils";

export interface SnapshotPayload {
  version: string;
  exportedAt: string;
  organization: { name: string; plan: string };
  funnels: unknown[];
  websites: unknown[];
  forms: unknown[];
  surveys: unknown[];
  calendars: unknown[];
  pipelines: unknown[];
  workflows: unknown[];
  emailSequences: unknown[];
  smsSequences: unknown[];
  aiAgents: unknown[];
  tags: unknown[];
  customFields: unknown[];
  products: unknown[];
  companies?: unknown[];
  courses?: unknown[];
  cronJobs?: unknown[];
  webhooks?: unknown[];
}

export async function exportSnapshot(organizationId: string): Promise<SnapshotPayload> {
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
    include: {
      funnels: { include: { pages: true } },
      websites: { include: { pages: true } },
      forms: { include: { fields: true } },
      surveys: { include: { questions: true } },
      calendars: { include: { slots: true } },
      pipelines: { include: { stages: true } },
      workflows: { include: { steps: true } },
      emailSequences: { include: { steps: true } },
      smsSequences: { include: { steps: true } },
      aiAgents: { include: { flows: true } },
      tags: true,
      customFields: true,
      products: true,
      companies: true,
      courses: true,
      cronJobs: true,
      webhooks: true,
    },
  });

  return {
    version: "2.0.0",
    exportedAt: new Date().toISOString(),
    organization: { name: org.name, plan: org.plan },
    funnels: org.funnels,
    websites: org.websites,
    forms: org.forms,
    surveys: org.surveys,
    calendars: org.calendars,
    pipelines: org.pipelines,
    workflows: org.workflows,
    emailSequences: org.emailSequences,
    smsSequences: org.smsSequences,
    aiAgents: org.aiAgents,
    tags: org.tags,
    customFields: org.customFields,
    products: org.products,
    companies: org.companies,
    courses: org.courses,
    cronJobs: org.cronJobs,
    webhooks: org.webhooks,
  };
}

export async function importSnapshot(
  organizationId: string,
  payload: SnapshotPayload
): Promise<{ imported: Record<string, number> }> {
  const counts: Record<string, number> = {};

  await prisma.$transaction(async (tx) => {
    for (const tag of payload.tags as { name: string; color: string }[]) {
      await tx.tag.upsert({
        where: { organizationId_name: { organizationId, name: tag.name } },
        create: { organizationId, name: tag.name, color: tag.color },
        update: { color: tag.color },
      });
    }
    counts.tags = payload.tags.length;

    for (const field of payload.customFields as { name: string; key: string; type: string }[]) {
      await tx.customField.upsert({
        where: { organizationId_key: { organizationId, key: field.key } },
        create: { organizationId, ...field },
        update: { name: field.name, type: field.type },
      });
    }
    counts.customFields = payload.customFields.length;

    for (const funnel of payload.funnels as {
      name: string;
      slug: string;
      status: string;
      customCss?: string;
      customHtml?: string;
      customJs?: string;
      pages: { name: string; slug: string; order: number; content: string; settings: string }[];
    }[]) {
      const created = await tx.funnel.create({
        data: {
          organizationId,
          name: funnel.name,
          slug: `${funnel.slug}-${Date.now()}`,
          status: funnel.status,
          customCss: funnel.customCss,
          customHtml: funnel.customHtml,
          customJs: funnel.customJs,
          pages: {
            create: funnel.pages.map((p) => ({
              name: p.name,
              slug: p.slug,
              order: p.order,
              content: p.content,
              settings: p.settings,
            })),
          },
        },
      });
      counts.funnels = (counts.funnels || 0) + 1;
      void created;
    }

    for (const form of payload.forms as {
      name: string;
      slug: string;
      settings: string;
      thankYouMsg: string;
      fields: { label: string; type: string; required: boolean; options?: string; order: number }[];
    }[]) {
      await tx.form.create({
        data: {
          organizationId,
          name: form.name,
          slug: `${form.slug}-${Date.now()}`,
          settings: form.settings,
          thankYouMsg: form.thankYouMsg,
          fields: { create: form.fields },
        },
      });
      counts.forms = (counts.forms || 0) + 1;
    }

    for (const pipeline of payload.pipelines as {
      name: string;
      stages: { name: string; order: number; color: string }[];
    }[]) {
      await tx.pipeline.create({
        data: {
          organizationId,
          name: pipeline.name,
          stages: { create: pipeline.stages },
        },
      });
      counts.pipelines = (counts.pipelines || 0) + 1;
    }

    for (const workflow of payload.workflows as {
      name: string;
      trigger: string;
      triggerConfig: string;
      status: string;
      steps: { type: string; config: string; order: number }[];
    }[]) {
      await tx.workflow.create({
        data: {
          organizationId,
          name: workflow.name,
          trigger: workflow.trigger,
          triggerConfig: workflow.triggerConfig,
          status: workflow.status,
          steps: { create: workflow.steps },
        },
      });
      counts.workflows = (counts.workflows || 0) + 1;
    }

    for (const seq of payload.emailSequences as {
      name: string;
      status: string;
      steps: { subject: string; body: string; delayDays: number; order: number }[];
    }[]) {
      await tx.emailSequence.create({
        data: {
          organizationId,
          name: seq.name,
          status: seq.status,
          steps: { create: seq.steps },
        },
      });
      counts.emailSequences = (counts.emailSequences || 0) + 1;
    }

    for (const product of payload.products as {
      name: string;
      description?: string;
      price: number;
      currency: string;
      interval?: string;
      status: string;
    }[]) {
      await tx.product.create({
        data: { organizationId, ...product },
      });
      counts.products = (counts.products || 0) + 1;
    }
  });

  return { imported: counts };
}

export async function cloneOrganization(
  sourceOrgId: string,
  newName: string,
  newSlug: string
) {
  const snapshot = await exportSnapshot(sourceOrgId);
  const org = await prisma.organization.create({
    data: { name: newName, slug: newSlug, plan: snapshot.organization.plan },
  });
  await importSnapshot(org.id, snapshot);
  return org;
}

export async function createBackup(organizationId: string, name: string) {
  const payload = await exportSnapshot(organizationId);
  return prisma.snapshot.create({
    data: {
      organizationId,
      name,
      description: `Backup created ${new Date().toLocaleString()}`,
      payload: JSON.stringify(payload),
    },
  });
}

export async function restoreBackup(snapshotId: string, targetOrgId: string) {
  const snapshot = await prisma.snapshot.findUniqueOrThrow({
    where: { id: snapshotId },
  });
  const payload = parseJson<SnapshotPayload>(snapshot.payload, {
    version: "1.0.0",
    exportedAt: "",
    organization: { name: "", plan: "starter" },
    funnels: [],
    websites: [],
    forms: [],
    surveys: [],
    calendars: [],
    pipelines: [],
    workflows: [],
    emailSequences: [],
    smsSequences: [],
    aiAgents: [],
    tags: [],
    customFields: [],
    products: [],
  });
  return importSnapshot(targetOrgId, payload);
}
