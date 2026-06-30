#!/usr/bin/env tsx
/**
 * SpotShip Cron Worker
 * Run: npm run cron
 * Processes scheduled jobs every minute
 */
import { prisma } from "../src/lib/db";
import { runCronJob, isJobDue } from "../src/lib/cron";

async function tick() {
  const jobs = await prisma.cronJob.findMany({ where: { status: "active" } });
  for (const job of jobs) {
    if (isJobDue(job.schedule, job.lastRunAt)) {
      console.log(`[CRON] Running: ${job.name} (${job.action})`);
      const result = await runCronJob(job.id);
      console.log(`[CRON] Result:`, result);
    }
  }
}

console.log("[CRON] Worker started. Polling every 60s...");
await tick();
setInterval(tick, 60000);
