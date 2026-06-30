"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card, Button } from "@/components/ui";

export default function OrganizationPage() {
  const [folders, setFolders] = useState<Array<{ id: string; name: string; color: string; _count: { organizations: number } }>>([]);

  async function load() {
    const res = await fetch("/api/resources");
    const data = await res.json();
    setFolders(data.folders);
  }

  useEffect(() => { load(); }, []);

  async function createFolder() {
    const name = prompt("Folder name:");
    if (!name) return;
    await fetch("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "folder", name, assignOrg: true }),
    });
    load();
  }

  return (
    <div>
      <PageHeader title="Account Organization" description="Organize client accounts into folders" action={<Button onClick={createFolder}>New Folder</Button>} />
      <div className="grid gap-4 md:grid-cols-3">
        {folders.map((f) => (
          <Card key={f.id}>
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded" style={{ backgroundColor: f.color }} />
              <h3 className="font-medium text-white">{f.name}</h3>
            </div>
            <p className="mt-2 text-sm text-slate-500">{f._count.organizations} accounts</p>
          </Card>
        ))}
      </div>
      <Card className="mt-6">
        <h3 className="font-medium text-white">Account Management Tips</h3>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-400">
          <li>Group accounts by industry, tier, or agency client</li>
          <li>Use snapshots to deploy identical setups across folders</li>
          <li>Clone accounts for quick client onboarding</li>
          <li>Back up before making major workflow changes</li>
        </ul>
      </Card>
    </div>
  );
}
