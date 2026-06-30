"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card, Button, EmptyState } from "@/components/ui";

interface Stage {
  id: string;
  name: string;
  color: string;
  _count: { opportunities: number };
}

interface Pipeline {
  id: string;
  name: string;
  stages: Stage[];
}

interface Opportunity {
  id: string;
  title: string;
  value: number;
  stageId: string;
  contact: { firstName: string | null; lastName: string | null; email: string };
}

export default function CrmPage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);

  async function load() {
    const [p, o] = await Promise.all([
      fetch("/api/pipelines").then((r) => r.json()),
      fetch("/api/opportunities").then((r) => r.json()),
    ]);
    setPipelines(p);
    setOpportunities(o);
  }

  useEffect(() => { load(); }, []);

  async function createPipeline() {
    const name = prompt("Pipeline name:");
    if (!name) return;
    await fetch("/api/pipelines", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    load();
  }

  async function moveOpportunity(id: string, stageId: string) {
    await fetch("/api/opportunities", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, stageId }),
    });
    load();
  }

  const pipeline = pipelines[0];

  return (
    <div>
      <PageHeader title="CRM Pipeline" description="Manage opportunity stages and deal flow" action={<Button onClick={createPipeline}>New Pipeline</Button>} />
      {!pipeline ? (
        <EmptyState title="No pipeline" description="Create a pipeline with default stages" />
      ) : (
        <div className="overflow-x-auto">
          <div className="flex gap-4 min-w-max pb-4">
            {pipeline.stages.map((stage) => (
              <div key={stage.id} className="w-72 shrink-0">
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: stage.color }} />
                  <h3 className="font-medium text-white">{stage.name}</h3>
                  <span className="text-xs text-slate-500">({stage._count.opportunities})</span>
                </div>
                <div className="space-y-2">
                  {opportunities
                    .filter((o) => o.stageId === stage.id)
                    .map((o) => (
                      <Card key={o.id} className="p-3">
                        <div className="font-medium text-white text-sm">{o.title}</div>
                        <div className="text-xs text-slate-500">{o.contact.email}</div>
                        <div className="mt-1 text-sm text-green-400">${o.value.toLocaleString()}</div>
                        <select
                          className="mt-2 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-300"
                          value={o.stageId}
                          onChange={(e) => moveOpportunity(o.id, e.target.value)}
                        >
                          {pipeline.stages.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </Card>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
