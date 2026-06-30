import { NextRequest } from "next/server";
import { withAuth, jsonOk } from "@/lib/api";
import { prisma } from "@/lib/db";
import { triggerWorkflows } from "@/lib/automations";

export async function GET() {
  return withAuth(async (session) => {
    const opportunities = await prisma.opportunity.findMany({
      where: { contact: { organizationId: session.organizationId } },
      include: { contact: true, stage: { include: { pipeline: true } } },
      orderBy: { updatedAt: "desc" },
    });
    return jsonOk(opportunities);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (session) => {
    const body = await req.json();
    const opportunity = await prisma.opportunity.create({
      data: {
        contactId: body.contactId,
        stageId: body.stageId,
        title: body.title,
        value: body.value || 0,
      },
      include: { contact: true, stage: true },
    });
    return jsonOk(opportunity);
  });
}

export async function PATCH(req: NextRequest) {
  return withAuth(async (session) => {
    const body = await req.json();
    const opportunity = await prisma.opportunity.update({
      where: { id: body.id },
      data: { stageId: body.stageId, status: body.status, value: body.value, title: body.title },
      include: { contact: true, stage: true },
    });

    if (body.stageId) {
      await triggerWorkflows(session.organizationId, "opportunity_stage_changed", {
        opportunityId: opportunity.id,
        contactId: opportunity.contactId,
        contactEmail: opportunity.contact.email,
      });
    }

    return jsonOk(opportunity);
  });
}
