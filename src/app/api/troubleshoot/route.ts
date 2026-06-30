import { withAuth, jsonOk } from "@/lib/api";
import { getAutomationHealth } from "@/lib/automations";
import { prisma } from "@/lib/db";

export async function GET() {
  return withAuth(async (session) => {
    const [health, logs, runs] = await Promise.all([
      getAutomationHealth(session.organizationId),
      prisma.automationLog.findMany({
        where: { organizationId: session.organizationId },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.workflowRun.findMany({
        where: { workflow: { organizationId: session.organizationId } },
        include: { workflow: { select: { name: true } } },
        orderBy: { startedAt: "desc" },
        take: 20,
      }),
    ]);
    return jsonOk({ health, logs, runs });
  });
}
