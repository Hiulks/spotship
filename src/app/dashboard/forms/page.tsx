"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card, Button, EmptyState } from "@/components/ui";

export default function FormsPage() {
  const [forms, setForms] = useState<Array<{ id: string; name: string; slug: string; _count: { submissions: number }; fields: unknown[] }>>([]);

  useEffect(() => {
    fetch("/api/forms").then((r) => r.json()).then(setForms);
  }, []);

  async function createForm() {
    const name = prompt("Form name:");
    if (!name) return;
    await fetch("/api/forms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        fields: [
          { label: "First Name", type: "text", required: true },
          { label: "Email", type: "email", required: true },
          { label: "Phone", type: "tel" },
        ],
      }),
    });
    const res = await fetch("/api/forms");
    setForms(await res.json());
  }

  return (
    <div>
      <PageHeader title="Forms" description="Capture leads with forms that trigger workflows automatically" action={<Button onClick={createForm}>New Form</Button>} />
      {forms.length === 0 ? (
        <EmptyState title="No forms" description="Create a form to start capturing leads" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {forms.map((f) => (
            <Card key={f.id}>
              <h3 className="font-medium text-white">{f.name}</h3>
              <p className="text-sm text-slate-500">{f._count.submissions} submissions · {(f.fields as unknown[]).length} fields</p>
              <code className="mt-2 block text-xs text-indigo-400">/form/demo/{f.slug}</code>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
