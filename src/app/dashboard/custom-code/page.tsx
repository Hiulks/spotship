"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card } from "@/components/ui";

export default function CustomCodePage() {
  const [funnels, setFunnels] = useState<Array<{ id: string; name: string; customCss: string | null; customHtml: string | null; customJs: string | null }>>([]);
  const [selected, setSelected] = useState("");
  const [code, setCode] = useState({ customCss: "", customHtml: "", customJs: "" });

  useEffect(() => {
    fetch("/api/funnels").then((r) => r.json()).then((data) => {
      setFunnels(data);
      if (data[0]) {
        setSelected(data[0].id);
        setCode({ customCss: data[0].customCss || "", customHtml: data[0].customHtml || "", customJs: data[0].customJs || "" });
      }
    });
  }, []);

  return (
    <div>
      <PageHeader title="Custom CSS, HTML & JavaScript" description="Inject custom code into funnels and websites" />
      <div className="mb-4">
        <select
          value={selected}
          onChange={(e) => {
            const f = funnels.find((f) => f.id === e.target.value);
            setSelected(e.target.value);
            if (f) setCode({ customCss: f.customCss || "", customHtml: f.customHtml || "", customJs: f.customJs || "" });
          }}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
        >
          {funnels.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {(["customCss", "customHtml", "customJs"] as const).map((field) => (
          <Card key={field}>
            <h3 className="mb-2 font-medium text-white">{field.replace("custom", "")}</h3>
            <textarea
              value={code[field]}
              onChange={(e) => setCode({ ...code, [field]: e.target.value })}
              className="h-64 w-full rounded-lg border border-slate-700 bg-slate-950 p-3 font-mono text-xs text-slate-300"
              placeholder={`Enter ${field}...`}
            />
          </Card>
        ))}
      </div>
    </div>
  );
}
