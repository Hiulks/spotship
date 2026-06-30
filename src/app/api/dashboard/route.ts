import { withAuth, jsonOk } from "@/lib/api";
import { getOrganizationContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAutomationHealth } from "@/lib/automations";

export async function GET() {
  return withAuth(async (session) => {
    const orgId = session.organizationId;

    const [
      org,
      contacts,
      funnels,
      workflows,
      opportunities,
      snapshots,
      health,
    ] = await Promise.all([
      getOrganizationContext(orgId),
      prisma.contact.count({ where: { organizationId: orgId } }),
      prisma.funnel.count({ where: { organizationId: orgId } }),
      prisma.workflow.count({ where: { organizationId: orgId } }),
      prisma.opportunity.count({
        where: { contact: { organizationId: orgId }, status: "open" },
      }),
      prisma.snapshot.count({ where: { organizationId: orgId } }),
      getAutomationHealth(orgId),
    ]);

    return jsonOk({
      organization: org,
      stats: { contacts, funnels, workflows, opportunities, snapshots },
      automationHealth: health,
    });
  });
}
