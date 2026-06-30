"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card, Button, Badge, EmptyState } from "@/components/ui";

interface Snapshot {
  id: string;
  name: string;
  description: string | null;
  version: string;
  isTemplate: boolean;
  createdAt: string;
}

export default function SnapshotsPage() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    const res = await fetch("/api/snapshots");
    setSnapshots(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function action(action: string, extra?: Record<string, unknown>) {
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/snapshots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setMessage(`${action} completed successfully`);
      if (action === "export" && data.payload) {
        const blob = new Blob([JSON.stringify(data.payload, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `spotship-snapshot-${Date.now()}.json`;
        a.click();
      }
      load();
    } else {
      setMessage(data.error || "Action failed");
    }
  }

  return (
    <div>
      <PageHeader
        title="Snapshots"
        description="1-click export, backup, clone, and restore entire business setups"
        action={
          <div className="flex gap-2">
            <Button onClick={() => action("backup", { name: `Backup ${new Date().toLocaleString()}` })} disabled={loading}>
              1-Click Backup
            </Button>
            <Button onClick={() => action("export", { name: "Full Export", isTemplate: true })} disabled={loading}>
              Export Snapshot
            </Button>
          </div>
        }
      />

      {message && <div className="mb-4 rounded-lg bg-indigo-500/10 p-3 text-sm text-indigo-300">{message}</div>}

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <h3 className="font-medium text-white">Export</h3>
          <p className="mt-2 text-sm text-slate-400">Package funnels, workflows, pipelines, forms, and more into a portable snapshot.</p>
          <Button className="mt-4" variant="secondary" onClick={() => action("export", { name: "Template Export", isTemplate: true })} disabled={loading}>
            Export Now
          </Button>
        </Card>
        <Card>
          <h3 className="font-medium text-white">Clone Account</h3>
          <p className="mt-2 text-sm text-slate-400">Duplicate this entire setup to a new client account instantly.</p>
          <Button
            className="mt-4"
            variant="secondary"
            onClick={() => {
              const name = prompt("New account name:");
              const slug = prompt("New account slug:");
              if (name && slug) action("clone", { name, slug });
            }}
            disabled={loading}
          >
            Clone Account
          </Button>
        </Card>
        <Card>
          <h3 className="font-medium text-white">Import</h3>
          <p className="mt-2 text-sm text-slate-400">Upload a snapshot JSON file to deploy a pre-built system.</p>
          <label className="mt-4 inline-block cursor-pointer">
            <span className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-indigo-500">
              Import JSON
            </span>
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const text = await file.text();
                action("import", { payload: JSON.parse(text) });
              }}
            />
          </label>
        </Card>
      </div>

      <h2 className="mb-4 text-lg font-medium text-white">Saved Snapshots & Backups</h2>
      {snapshots.length === 0 ? (
        <EmptyState title="No snapshots yet" description="Create your first backup or export to get started" />
      ) : (
        <div className="space-y-3">
          {snapshots.map((s) => (
            <Card key={s.id} className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">{s.name}</span>
                  {s.isTemplate && <Badge color="green">Template</Badge>}
                  <Badge>v{s.version}</Badge>
                </div>
                <div className="text-sm text-slate-500">{new Date(s.createdAt).toLocaleString()}</div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => action("restore", { snapshotId: s.id })} disabled={loading}>
                  Restore
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
