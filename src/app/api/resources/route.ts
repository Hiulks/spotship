import { NextRequest } from "next/server";
import { withAuth, jsonOk, jsonError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";

export async function GET() {
  return withAuth(async (session) => {
    const items = await Promise.all([
      prisma.calendar.findMany({ where: { organizationId: session.organizationId }, include: { slots: true } }),
      prisma.emailSequence.findMany({ where: { organizationId: session.organizationId }, include: { steps: true } }),
      prisma.smsSequence.findMany({ where: { organizationId: session.organizationId }, include: { steps: true } }),
      prisma.aiAgent.findMany({ where: { organizationId: session.organizationId }, include: { flows: true } }),
      prisma.webhook.findMany({ where: { organizationId: session.organizationId } }),
      prisma.apiIntegration.findMany({ where: { organizationId: session.organizationId } }),
      prisma.website.findMany({ where: { organizationId: session.organizationId }, include: { pages: true } }),
      prisma.survey.findMany({ where: { organizationId: session.organizationId }, include: { questions: true } }),
      prisma.accountFolder.findMany({ include: { _count: { select: { organizations: true } } } }),
    ]);

    return jsonOk({
      calendars: items[0],
      emailSequences: items[1],
      smsSequences: items[2],
      aiAgents: items[3],
      webhooks: items[4],
      integrations: items[5],
      websites: items[6],
      surveys: items[7],
      folders: items[8],
    });
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (session) => {
    const body = await req.json();
    const orgId = session.organizationId;

    switch (body.type) {
      case "calendar": {
        const cal = await prisma.calendar.create({
          data: {
            organizationId: orgId,
            name: body.name,
            slug: body.slug || slugify(body.name),
            duration: body.duration || 30,
            slots: {
              create: body.slots || [
                { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
                { dayOfWeek: 2, startTime: "09:00", endTime: "17:00" },
                { dayOfWeek: 3, startTime: "09:00", endTime: "17:00" },
                { dayOfWeek: 4, startTime: "09:00", endTime: "17:00" },
                { dayOfWeek: 5, startTime: "09:00", endTime: "17:00" },
              ],
            },
          },
          include: { slots: true },
        });
        return jsonOk(cal);
      }

      case "email_sequence": {
        const seq = await prisma.emailSequence.create({
          data: {
            organizationId: orgId,
            name: body.name,
            status: body.status || "draft",
            steps: {
              create: (body.steps || []).map(
                (s: { subject: string; body: string; delayDays?: number }, i: number) => ({
                  subject: s.subject,
                  body: s.body,
                  delayDays: s.delayDays || 0,
                  order: i,
                })
              ),
            },
          },
          include: { steps: true },
        });
        return jsonOk(seq);
      }

      case "sms_sequence": {
        const seq = await prisma.smsSequence.create({
          data: {
            organizationId: orgId,
            name: body.name,
            steps: {
              create: (body.steps || []).map((s: { message: string; delayDays?: number }, i: number) => ({
                message: s.message,
                delayDays: s.delayDays || 0,
                order: i,
              })),
            },
          },
          include: { steps: true },
        });
        return jsonOk(seq);
      }

      case "ai_agent": {
        const agent = await prisma.aiAgent.create({
          data: {
            organizationId: orgId,
            name: body.name,
            systemPrompt: body.systemPrompt || "You are a helpful business assistant.",
            flows: body.flow
              ? {
                  create: {
                    name: body.flow.name || "Default Flow",
                    nodes: JSON.stringify(body.flow.nodes || []),
                    status: "active",
                  },
                }
              : undefined,
          },
          include: { flows: true },
        });
        return jsonOk(agent);
      }

      case "webhook": {
        const webhook = await prisma.webhook.create({
          data: {
            organizationId: orgId,
            name: body.name,
            url: body.url,
            events: JSON.stringify(body.events || ["*"]),
            secret: body.secret,
          },
        });
        return jsonOk(webhook);
      }

      case "website": {
        const site = await prisma.website.create({
          data: {
            organizationId: orgId,
            name: body.name,
            slug: body.slug || slugify(body.name),
            customCss: body.customCss,
            customHtml: body.customHtml,
            customJs: body.customJs,
            pages: body.pages
              ? {
                  create: body.pages.map(
                    (p: { name: string; slug: string; content: string }, i: number) => ({
                      name: p.name,
                      slug: p.slug,
                      content: p.content,
                      order: i,
                    })
                  ),
                }
              : undefined,
          },
          include: { pages: true },
        });
        return jsonOk(site);
      }

      case "survey": {
        const survey = await prisma.survey.create({
          data: {
            organizationId: orgId,
            name: body.name,
            slug: body.slug || slugify(body.name),
            questions: {
              create: (body.questions || []).map(
                (q: { question: string; type: string }, i: number) => ({
                  question: q.question,
                  type: q.type || "text",
                  order: i,
                })
              ),
            },
          },
          include: { questions: true },
        });
        return jsonOk(survey);
      }

      case "folder": {
        const folder = await prisma.accountFolder.create({ data: { name: body.name, color: body.color } });
        if (body.assignOrg) {
          await prisma.organization.update({
            where: { id: orgId },
            data: { folderId: folder.id },
          });
        }
        return jsonOk(folder);
      }

      default:
        return jsonError("Unknown type");
    }
  });
}
