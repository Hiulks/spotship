"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card, Button, Badge, EmptyState } from "@/components/ui";

function ResourceList({ title, description, type, items, onCreate }: {
  title: string;
  description: string;
  type: string;
  items: Array<{ id: string; name: string; status?: string; steps?: unknown[] }>;
  onCreate: () => void;
}) {
  return (
    <div className="mb-10">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-white">{title}</h2>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        <Button variant="secondary" onClick={onCreate}>Add</Button>
      </div>
      {items.length === 0 ? (
        <EmptyState title={`No ${title.toLowerCase()}`} description={`Create your first ${title.toLowerCase().slice(0, -1)}`} />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <Card key={item.id}>
              <div className="flex items-center gap-2">
                <span className="font-medium text-white">{item.name}</span>
                {item.status && <Badge color={item.status === "active" ? "green" : "yellow"}>{item.status}</Badge>}
              </div>
              {item.steps && <p className="mt-1 text-sm text-slate-500">{(item.steps as unknown[]).length} steps</p>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SequencesPage() {
  const [data, setData] = useState<{ emailSequences: unknown[]; smsSequences: unknown[] }>({ emailSequences: [], smsSequences: [] });

  async function load() {
    const res = await fetch("/api/resources");
    const json = await res.json();
    setData({ emailSequences: json.emailSequences, smsSequences: json.smsSequences });
  }

  useEffect(() => { load(); }, []);

  async function create(type: string, body: Record<string, unknown>) {
    await fetch("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, ...body }),
    });
    load();
  }

  return (
    <div>
      <PageHeader title="Email & SMS Sequences" description="Multi-step nurture campaigns with delays" />
      <ResourceList
        title="Email Sequences"
        description="Automated email drip campaigns"
        type="email_sequence"
        items={data.emailSequences as Array<{ id: string; name: string; status?: string; steps?: unknown[] }>}
        onCreate={() => create("email_sequence", {
          name: "Welcome Sequence",
          status: "active",
          steps: [
            { subject: "Welcome!", body: "Thanks for joining us.", delayDays: 0 },
            { subject: "Getting started", body: "Here are your next steps...", delayDays: 2 },
            { subject: "Special offer", body: "Exclusive deal inside.", delayDays: 5 },
          ],
        })}
      />
      <ResourceList
        title="SMS Sequences"
        description="Text message follow-up campaigns"
        type="sms_sequence"
        items={data.smsSequences as Array<{ id: string; name: string; steps?: unknown[] }>}
        onCreate={() => create("sms_sequence", {
          name: "SMS Follow-up",
          steps: [
            { message: "Hi! Thanks for your interest.", delayDays: 0 },
            { message: "Still thinking it over? Let us know!", delayDays: 3 },
          ],
        })}
      />
    </div>
  );
}
