"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card, Button, EmptyState } from "@/components/ui";

type ResourcePageProps = {
  title: string;
  description: string;
  resourceKey: "websites" | "surveys" | "calendars";
  createType: string;
  createPayload: Record<string, unknown>;
};

function GenericResourcePage({ title, description, resourceKey, createType, createPayload }: ResourcePageProps) {
  const [items, setItems] = useState<Array<{ id: string; name: string; slug: string }>>([]);

  async function load() {
    const res = await fetch("/api/resources");
    const data = await res.json();
    setItems(data[resourceKey] || []);
  }

  useEffect(() => { load(); }, [resourceKey]);

  async function create() {
    await fetch("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: createType, ...createPayload }),
    });
    load();
  }

  return (
    <div>
      <PageHeader title={title} description={description} action={<Button onClick={create}>Create</Button>} />
      {items.length === 0 ? (
        <EmptyState title={`No ${title.toLowerCase()}`} description={`Create your first ${title.toLowerCase().slice(0, -1)}`} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <Card key={item.id}>
              <h3 className="font-medium text-white">{item.name}</h3>
              <p className="text-sm text-slate-500">/{item.slug}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function WebsitesPage() {
  return (
    <GenericResourcePage
      title="Websites"
      description="Full websites with custom CSS, HTML, and JavaScript"
      resourceKey="websites"
      createType="website"
      createPayload={{
        name: "Business Website",
        pages: [
          { name: "Home", slug: "home", content: JSON.stringify({ blocks: [{ type: "hero", headline: "Welcome" }] }) },
          { name: "About", slug: "about", content: JSON.stringify({ blocks: [{ type: "text", content: "About us" }] }) },
          { name: "Contact", slug: "contact", content: JSON.stringify({ blocks: [{ type: "form", formSlug: "contact" }] }) },
        ],
        customCss: "body { font-family: system-ui; }",
      }}
    />
  );
}
