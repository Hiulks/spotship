import { NextRequest } from "next/server";
import { withAuth, jsonOk } from "@/lib/api";
import { prisma } from "@/lib/db";

export async function GET() {
  return withAuth(async (session) => {
    const workflows = await prisma.workflow.findMany({
      where: { organizationId: session.organizationId },
      include: { steps: { orderBy: { order: "asc" } }, _count: { select: { runs: true } } },
      orderBy: { updatedAt: "desc" },
    });
    return jsonOk(workflows);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (session) => {
    const body = await req.json();
    const workflow = await prisma.workflow.create({
      data: {
        organizationId: session.organizationId,
        name: body.name,
        trigger: body.trigger,
        triggerConfig: JSON.stringify(body.triggerConfig || {}),
        status: body.status || "draft",
        steps: body.steps
          ? {
              create: body.steps.map(
                (s: { type: string; config?: Record<string, unknown>; order?: number }, i: number) => ({
                  type: s.type,
                  config: JSON.stringify(s.config || {}),
                  order: s.order ?? i,
                })
              ),
            }
          : undefined,
      },
      include: { steps: true },
    });
    return jsonOk(workflow);
  });
}

export async function PATCH(req: NextRequest) {
  return withAuth(async (session) => {
    const body = await req.json();
    const workflow = await prisma.workflow.update({
      where: { id: body.id, organizationId: session.organizationId },
      data: { status: body.status, name: body.name },
    });
    return jsonOk(workflow);
  });
}
