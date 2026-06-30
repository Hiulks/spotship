import { prisma } from "@/lib/db";
import { createBackup } from "@/lib/snapshots";
import { exportSnapshot } from "@/lib/snapshots";
import { emitEvent } from "@/lib/event-bus";

export async function runCronJob(jobId: string) {
  const job = await prisma.cronJob.findUniqueOrThrow({ where: { id: jobId } });
  const run = await prisma.cronJobRun.create({
    data: { jobId, status: "running" },
  });

  try {
    let output = "";
    const config = JSON.parse(job.config || "{}");

    switch (job.action) {
      case "backup": {
        const backup = await createBackup(job.organizationId, `Cron backup ${new Date().toISOString()}`);
        output = `Backup created: ${backup.id}`;
        break;
      }
      case "sync_contacts": {
        const count = await prisma.contact.count({ where: { organizationId: job.organizationId } });
        output = `Contacts synced: ${count}`;
        await emitEvent(job.organizationId, "cron.sync_contacts", { count });
        break;
      }
      case "export_snapshot": {
        const payload = await exportSnapshot(job.organizationId);
        output = `Exported ${Object.keys(payload).length} sections`;
        break;
      }
      case "webhook_ping": {
        if (config.url) {
          const res = await fetch(config.url, { method: "POST", body: JSON.stringify({ ping: true }) });
          output = `Ping: ${res.status}`;
        }
        break;
      }
      case "cleanup_logs": {
        const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const deleted = await prisma.automationLog.deleteMany({
          where: { organizationId: job.organizationId, createdAt: { lt: cutoff }, level: "info" },
        });
        output = `Cleaned ${deleted.count} logs`;
        break;
      }
      default:
        output = `Unknown action: ${job.action}`;
    }

    await prisma.cronJobRun.update({
      where: { id: run.id },
      data: { status: "completed", output, endedAt: new Date() },
    });
    await prisma.cronJob.update({
      where: { id: jobId },
      data: { lastRunAt: new Date() },
    });
    return { status: "completed", output };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await prisma.cronJobRun.update({
      where: { id: run.id },
      data: { status: "failed", error: message, endedAt: new Date() },
    });
    return { status: "failed", error: message };
  }
}

export async function runDueCronJobs() {
  const jobs = await prisma.cronJob.findMany({ where: { status: "active" } });
  const results = [];
  for (const job of jobs) {
    const result = await runCronJob(job.id);
    results.push({ jobId: job.id, name: job.name, ...result });
  }
  return results;
}

// Simple schedule matcher: supports "every_N_minutes" or cron-like "0 * * * *" (hourly)
export function isJobDue(schedule: string, lastRunAt: Date | null): boolean {
  if (schedule.startsWith("every_")) {
    const minutes = parseInt(schedule.replace("every_", "").replace("_minutes", ""));
    if (!lastRunAt) return true;
    return Date.now() - lastRunAt.getTime() >= minutes * 60 * 1000;
  }
  if (schedule === "hourly") {
    if (!lastRunAt) return true;
    return Date.now() - lastRunAt.getTime() >= 3600000;
  }
  if (schedule === "daily") {
    if (!lastRunAt) return true;
    return Date.now() - lastRunAt.getTime() >= 86400000;
  }
  return true;
}
