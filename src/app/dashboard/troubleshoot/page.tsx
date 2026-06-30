"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card, Badge } from "@/components/ui";

export default function TroubleshootPage() {
  const [data, setData] = useState<{
    health: { failedRuns: number; activeWorkflows: number };
    logs: Array<{ id: string; source: string; level: string; message: string; createdAt: string }>;
    runs: Array<{ id: string; status: string; error: string | null; workflow: { name: string }; startedAt: string }>;
  } | null>(null);

  useEffect(() => {
    fetch("/api/troubleshoot").then((r) => r.json()).then(setData);
  }, []);

  if (!data) return <div className="text-slate-400">Loading...</div>;

  return (
    <div>
      <PageHeader title="Troubleshoot" description="Debug automations, workflows, and integration issues" />
      <div className="mb-8 grid grid-cols-3 gap-4">
        <Card>
          <div className="text-sm text-slate-400">Failed Runs</div>
          <div className={`text-3xl font-semibold ${data.health.failedRuns > 0 ? "text-red-400" : "text-green-400"}`}>
            {data.health.failedRuns}
          </div>
        </Card>
        <Card>
          <div className="text-sm text-slate-400">Active Workflows</div>
          <div className="text-3xl font-semibold text-white">{data.health.activeWorkflows}</div>
        </Card>
        <Card>
          <div className="text-sm text-slate-400">Recent Errors</div>
          <div className="text-3xl font-semibold text-white">{data.logs.filter((l) => l.level === "error").length}</div>
        </Card>
      </div>

      <h2 className="mb-4 text-lg font-medium text-white">Workflow Runs</h2>
      <div className="mb-8 space-y-2">
        {data.runs.map((r) => (
          <Card key={r.id} className="flex items-center justify-between p-3">
            <div>
              <span className="text-white">{r.workflow.name}</span>
              <div className="text-xs text-slate-500">{new Date(r.startedAt).toLocaleString()}</div>
              {r.error && <div className="text-xs text-red-400">{r.error}</div>}
            </div>
            <Badge color={r.status === "completed" ? "green" : r.status === "failed" ? "red" : "yellow"}>{r.status}</Badge>
          </Card>
        ))}
      </div>

      <h2 className="mb-4 text-lg font-medium text-white">Automation Logs</h2>
      <div className="space-y-1 font-mono text-xs">
        {data.logs.map((l) => (
          <div key={l.id} className={`rounded px-3 py-2 ${l.level === "error" ? "bg-red-950/30 text-red-300" : "bg-slate-900 text-slate-400"}`}>
            [{new Date(l.createdAt).toLocaleTimeString()}] [{l.level}] {l.source}: {l.message}
          </div>
        ))}
      </div>
    </div>
  );
}
