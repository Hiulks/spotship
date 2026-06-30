import { prisma } from "./db";
import { parseJson } from "./utils";
import { sendEmail, sendSms } from "./messaging";
import { emitEvent } from "./event-bus";

export type WorkflowTrigger =
  | "form_submit"
  | "contact_created"
  | "opportunity_stage_changed"
  | "appointment_booked"
  | "payment_received"
  | "tag_added"
  | "webhook";

export type WorkflowAction =
  | "send_email"
  | "send_sms"
  | "add_tag"
  | "move_opportunity"
  | "wait"
  | "webhook"
  | "start_sequence"
  | "ai_reply";

interface TriggerContext {
  contactId?: string;
  contactEmail?: string;
  formId?: string;
  opportunityId?: string;
  data?: Record<string, unknown>;
}

export async function logAutomation(
  organizationId: string,
  source: string,
  level: string,
  message: string,
  metadata?: Record<string, unknown>
) {
  return prisma.automationLog.create({
    data: {
      organizationId,
      source,
      level,
      message,
      metadata: JSON.stringify(metadata || {}),
    },
  });
}

export async function triggerWorkflows(
  organizationId: string,
  trigger: WorkflowTrigger,
  context: TriggerContext
) {
  const workflows = await prisma.workflow.findMany({
    where: { organizationId, trigger, status: "active" },
    include: { steps: { orderBy: { order: "asc" } } },
  });

  const results = [];

  for (const workflow of workflows) {
    const run = await prisma.workflowRun.create({
      data: {
        workflowId: workflow.id,
        contactId: context.contactId,
        context: JSON.stringify(context),
        status: "running",
      },
    });

    try {
      for (const step of workflow.steps) {
        const config = parseJson<Record<string, unknown>>(step.config, {});
        await executeStep(organizationId, step.type as WorkflowAction, config, context);
        await logAutomation(organizationId, `workflow:${workflow.id}`, "info", `Executed step: ${step.type}`, {
          workflowId: workflow.id,
          stepId: step.id,
          runId: run.id,
        });
      }

      await prisma.workflowRun.update({
        where: { id: run.id },
        data: { status: "completed", finishedAt: new Date() },
      });
      await emitEvent(organizationId, "workflow.completed", { workflowId: workflow.id, runId: run.id });
      results.push({ workflowId: workflow.id, status: "completed" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      await prisma.workflowRun.update({
        where: { id: run.id },
        data: { status: "failed", error: message, finishedAt: new Date() },
      });
      await emitEvent(organizationId, "workflow.failed", { workflowId: workflow.id, runId: run.id, error: message });
      await logAutomation(organizationId, `workflow:${workflow.id}`, "error", message, {
        workflowId: workflow.id,
        runId: run.id,
      });
      results.push({ workflowId: workflow.id, status: "failed", error: message });
    }
  }

  return results;
}

async function executeStep(
  organizationId: string,
  type: WorkflowAction,
  config: Record<string, unknown>,
  context: TriggerContext
) {
  switch (type) {
    case "send_email":
      if (context.contactEmail) {
        await sendEmail({
          organizationId,
          to: context.contactEmail,
          subject: (config.subject as string) || "Notification",
          body: (config.body as string) || "",
          contactId: context.contactId,
        });
      }
      break;

    case "send_sms": {
      const phone = context.data?.phone as string | undefined;
      const contact = context.contactId
        ? await prisma.contact.findUnique({ where: { id: context.contactId } })
        : null;
      const to = phone || contact?.phone;
      if (to) {
        await sendSms({
          organizationId,
          to,
          message: (config.message as string) || "",
          contactId: context.contactId,
        });
      }
      break;
    }

    case "add_tag":
      if (context.contactId && config.tag) {
        const contact = await prisma.contact.findUnique({ where: { id: context.contactId } });
        if (contact) {
          const tags = parseJson<string[]>(contact.tags, []);
          if (!tags.includes(config.tag as string)) {
            tags.push(config.tag as string);
            await prisma.contact.update({
              where: { id: contact.id },
              data: { tags: JSON.stringify(tags) },
            });
            await emitEvent(organizationId, "tag.added", { contactId: contact.id, tag: config.tag });
          }
        }
      }
      break;

    case "move_opportunity":
      if (context.opportunityId && config.stageId) {
        await prisma.opportunity.update({
          where: { id: context.opportunityId },
          data: { stageId: config.stageId as string },
        });
      }
      break;

    case "wait":
      // In production: queue delayed job. Simulated here.
      break;

    case "webhook":
      if (config.url) {
        try {
          await fetch(config.url as string, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(context),
          });
        } catch (e) {
          throw new Error(`Webhook failed: ${e instanceof Error ? e.message : "unknown"}`);
        }
      }
      break;

    case "start_sequence":
      await logAutomation(organizationId, "sequence", "info", `Sequence started: ${config.sequenceId}`, context as Record<string, unknown>);
      break;

    case "ai_reply":
      await logAutomation(organizationId, "ai", "info", `AI reply triggered for agent: ${config.agentId}`, context as Record<string, unknown>);
      break;
  }
}

export async function getAutomationHealth(organizationId: string) {
  const [failedRuns, recentLogs, activeWorkflows] = await Promise.all([
    prisma.workflowRun.count({
      where: { workflow: { organizationId }, status: "failed" },
    }),
    prisma.automationLog.findMany({
      where: { organizationId, level: "error" },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.workflow.count({
      where: { organizationId, status: "active" },
    }),
  ]);

  return { failedRuns, recentErrors: recentLogs, activeWorkflows };
}
