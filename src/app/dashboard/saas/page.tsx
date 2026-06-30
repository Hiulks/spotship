"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card, Button } from "@/components/ui";

export default function SaasPage() {
  const [saas, setSaas] = useState({ enabled: false, resellerName: "", defaultPlan: "starter", allowSubAccounts: true, maxSubAccounts: 50, revenueSharePercent: 20 });

  useEffect(() => {
    fetch("/api/settings/white-label").then((r) => r.json()).then((d) => {
      if (d.saas) setSaas(d.saas);
    });
  }, []);

  async function save() {
    await fetch("/api/settings/white-label", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ saas }),
    });
    alert("SaaS config saved!");
  }

  return (
    <div>
      <PageHeader title="SaaS Mode" description="Resell SpotShip to your own clients with sub-accounts" action={<Button onClick={save}>Save Config</Button>} />
      <Card className="max-w-xl space-y-4">
        <label className="flex items-center gap-2 text-white">
          <input type="checkbox" checked={saas.enabled} onChange={(e) => setSaas({ ...saas, enabled: e.target.checked })} />
          Enable SaaS Mode
        </label>
        {(["resellerName", "defaultPlan"] as const).map((field) => (
          <label key={field} className="block">
            <span className="mb-1 block text-sm text-slate-400 capitalize">{field.replace(/([A-Z])/g, " $1")}</span>
            <input
              value={saas[field] || ""}
              onChange={(e) => setSaas({ ...saas, [field]: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            />
          </label>
        ))}
        <label className="block">
          <span className="mb-1 block text-sm text-slate-400">Max Sub-Accounts</span>
          <input type="number" value={saas.maxSubAccounts} onChange={(e) => setSaas({ ...saas, maxSubAccounts: parseInt(e.target.value) })} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-slate-400">Revenue Share %</span>
          <input type="number" value={saas.revenueSharePercent} onChange={(e) => setSaas({ ...saas, revenueSharePercent: parseFloat(e.target.value) })} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
        </label>
      </Card>
      <Card className="mt-6 max-w-xl">
        <h3 className="font-medium text-white">Best Practices</h3>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-400">
          <li>Create a master snapshot template before onboarding clients</li>
          <li>Use folders to organize client accounts by niche or tier</li>
          <li>Enable white-label before sharing login URLs</li>
          <li>Connect Stripe Connect for automated revenue sharing</li>
          <li>Set up affiliate program for referral-based growth</li>
        </ul>
      </Card>
    </div>
  );
}
