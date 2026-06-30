"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card, Button } from "@/components/ui";

export default function WhiteLabelPage() {
  const [config, setConfig] = useState({ brandName: "", logoUrl: "", primaryColor: "#6366f1", customDomain: "", supportEmail: "", hidePoweredBy: false });

  useEffect(() => {
    fetch("/api/settings/white-label").then((r) => r.json()).then((d) => {
      if (d.whiteLabel) setConfig(d.whiteLabel);
    });
  }, []);

  async function save() {
    await fetch("/api/settings/white-label", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    alert("Saved!");
  }

  return (
    <div>
      <PageHeader title="White Label" description="Brand the platform as your own" action={<Button onClick={save}>Save</Button>} />
      <Card className="max-w-xl space-y-4">
        {(["brandName", "logoUrl", "primaryColor", "customDomain", "supportEmail"] as const).map((field) => (
          <label key={field} className="block">
            <span className="mb-1 block text-sm text-slate-400 capitalize">{field.replace(/([A-Z])/g, " $1")}</span>
            <input
              value={config[field] || ""}
              onChange={(e) => setConfig({ ...config, [field]: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            />
          </label>
        ))}
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={config.hidePoweredBy} onChange={(e) => setConfig({ ...config, hidePoweredBy: e.target.checked })} />
          Hide &quot;Powered by SpotShip&quot;
        </label>
      </Card>
    </div>
  );
}
