"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card, Button, Badge, EmptyState } from "@/components/ui";

export default function FunnelsPage() {
  const [funnels, setFunnels] = useState<Array<{ id: string; name: string; slug: string; status: string; pages: unknown[] }>>([]);

  async function load() {
    const res = await fetch("/api/funnels");
    setFunnels(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function createFunnel() {
    const name = prompt("Funnel name:");
    if (!name) return;
    await fetch("/api/funnels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        pages: [
          {
            name: "Landing Page",
            slug: "landing",
            content: JSON.stringify({
              blocks: [
                { type: "hero", headline: name, subheadline: "Your offer starts here", cta: "Get Started" },
                { type: "features", items: ["Feature 1", "Feature 2", "Feature 3"] },
              ],
            }),
          },
          {
            name: "Thank You",
            slug: "thank-you",
            content: JSON.stringify({ blocks: [{ type: "text", content: "Thank you for signing up!" }] }),
          },
        ],
      }),
    });
    load();
  }

  return (
    <div>
      <PageHeader title="Funnels" description="Build conversion funnels with custom CSS, HTML, and JavaScript" action={<Button onClick={createFunnel}>New Funnel</Button>} />
      {funnels.length === 0 ? (
        <EmptyState title="No funnels" description="Create your first funnel to start converting leads" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {funnels.map((f) => (
            <Card key={f.id}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-white">{f.name}</h3>
                  <p className="text-sm text-slate-500">/{f.slug}</p>
                </div>
                <Badge color={f.status === "published" ? "green" : "yellow"}>{f.status}</Badge>
              </div>
              <p className="mt-2 text-sm text-slate-400">{(f.pages as unknown[]).length} pages</p>
              <a href={`/funnel/demo/${f.slug}`} target="_blank" className="mt-3 inline-block text-sm text-indigo-400 hover:underline">
                Preview →
              </a>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
