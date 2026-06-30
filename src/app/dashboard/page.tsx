"use client";

import { useEffect, useState } from "react";
import { PageHeader, StatCard, Card, Badge } from "@/components/ui";
import Link from "next/link";

interface DashboardData {
  organization: { name: string; slug: string; plan: string };
  stats: { contacts: number; funnels: number; workflows: number; opportunities: number; snapshots: number };
  automationHealth: { failedRuns: number; activeWorkflows: number };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) return <div className="text-slate-400">Loading...</div>;

  return (
    <div>
      <PageHeader
        title={`Welcome back`}
        description={`${data.organization.name} · Plan: ${data.organization.plan}`}
      />

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Contacts" value={data.stats.contacts} />
        <StatCard label="Funnels" value={data.stats.funnels} />
        <StatCard label="Workflows" value={data.stats.workflows} sub={`${data.automationHealth.activeWorkflows} active`} />
        <StatCard label="Open Deals" value={data.stats.opportunities} />
        <StatCard label="Snapshots" value={data.stats.snapshots} />
      </div>

      {data.automationHealth.failedRuns > 0 && (
        <Card className="mb-8 border-red-900/50 bg-red-950/20">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-red-300">Automation issues detected</div>
              <div className="text-sm text-red-400/80">{data.automationHealth.failedRuns} failed workflow runs</div>
            </div>
            <Link href="/dashboard/troubleshoot" className="text-sm text-red-300 underline">
              Troubleshoot →
            </Link>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold text-white">Ship a client in 1 click</h2>
          <p className="mb-4 text-sm text-slate-400">
            Export your entire setup as a snapshot, then import it into a new account. Funnels, workflows,
            pipelines, forms, and more — all replicated instantly.
          </p>
          <Link href="/dashboard/snapshots" className="text-sm text-indigo-400 hover:underline">
            Go to Snapshots →
          </Link>
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold text-white">Quick actions</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { href: "/dashboard/funnels", label: "New Funnel" },
              { href: "/dashboard/forms", label: "New Form" },
              { href: "/dashboard/workflows", label: "New Workflow" },
              { href: "/dashboard/crm", label: "View Pipeline" },
            ].map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:border-indigo-500 hover:text-indigo-300"
              >
                {a.label}
              </Link>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="mb-4 font-semibold text-white">Platform capabilities</h2>
          <div className="flex flex-wrap gap-2">
            {[
              "Funnels & Websites",
              "Forms & Surveys",
              "Calendars",
              "CRM Pipelines",
              "Automations",
              "Email & SMS",
              "AI Agents",
              "Custom Code",
              "API & Webhooks",
              "Stripe Payments",
              "SaaS Mode",
              "White Label",
              "Affiliates",
            ].map((f) => (
              <Badge key={f}>{f}</Badge>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
