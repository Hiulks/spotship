"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card, Button, Badge, EmptyState } from "@/components/ui";

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Array<{ id: string; name: string; trigger: string; status: string; steps: unknown[]; _count: { runs: number } }>>([]);

  async function load() {
    const res = await fetch("/api/workflows");
    setWorkflows(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function createWorkflow() {
    await fetch("/api/workflows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "New Lead Welcome",
        trigger: "form_submit",
        status: "active",
        steps: [
          { type: "add_tag", config: { tag: "new-lead" } },
          { type: "send_email", config: { subject: "Welcome!", body: "Thanks for reaching out." } },
          { type: "wait", config: { days: 1 } },
          { type: "send_sms", config: { message: "Following up on your inquiry!" } },
        ],
      }),
    });
    load();
  }

  async function toggleStatus(id: string, status: string) {
    await fetch("/api/workflows", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: status === "active" ? "draft" : "active" }),
    });
    load();
  }

  return (
    <div>
      <PageHeader title="Workflows & Automations" description="Trigger actions on form submits, stage changes, payments, and more" action={<Button onClick={createWorkflow}>New Workflow</Button>} />
      {workflows.length === 0 ? (
        <EmptyState title="No workflows" description="Automate your business processes" />
      ) : (
        <div className="space-y-3">
          {workflows.map((w) => (
            <Card key={w.id} className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">{w.name}</span>
                  <Badge color={w.status === "active" ? "green" : "yellow"}>{w.status}</Badge>
                </div>
                <div className="text-sm text-slate-500">
                  Trigger: {w.trigger} · {(w.steps as unknown[]).length} steps · {w._count.runs} runs
                </div>
              </div>
              <Button variant="secondary" onClick={() => toggleStatus(w.id, w.status)}>
                {w.status === "active" ? "Pause" : "Activate"}
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
