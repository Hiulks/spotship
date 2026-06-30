import { withAuth, jsonOk } from "@/lib/api";
import { runCronJob, runDueCronJobs } from "@/lib/cron";
import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET() {
  return withAuth(async (session) => {
    const jobs = await prisma.cronJob.findMany({
      where: { organizationId: session.organizationId },
      include: { runs: { orderBy: { startedAt: "desc" }, take: 5 } },
    });
    return jsonOk(jobs);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (session) => {
    const body = await req.json();

    if (body.action === "run_all") {
      const results = await runDueCronJobs();
      return jsonOk(results);
    }

    if (body.action === "run" && body.jobId) {
      const result = await runCronJob(body.jobId);
      return jsonOk(result);
    }

    const job = await prisma.cronJob.create({
      data: {
        organizationId: session.organizationId,
        name: body.name,
        schedule: body.schedule || "every_5_minutes",
        action: body.action || "backup",
        config: JSON.stringify(body.config || {}),
        status: "active",
      },
    });
    return jsonOk(job);
  });
}
