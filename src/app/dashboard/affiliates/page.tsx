"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card, Button, Badge, EmptyState } from "@/components/ui";

export default function AffiliatesPage() {
  const [affiliates, setAffiliates] = useState<Array<{ id: string; name: string; email: string; code: string; commissionRate: number; _count: { referrals: number } }>>([]);

  async function load() {
    const res = await fetch("/api/affiliates");
    setAffiliates(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function create() {
    const name = prompt("Affiliate name:");
    const email = prompt("Affiliate email:");
    if (!name || !email) return;
    await fetch("/api/affiliates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, commissionRate: 20 }),
    });
    load();
  }

  return (
    <div>
      <PageHeader title="Affiliates" description="Track referrals and commission payouts" action={<Button onClick={create}>Add Affiliate</Button>} />
      {affiliates.length === 0 ? (
        <EmptyState title="No affiliates" description="Set up your affiliate program" />
      ) : (
        <div className="space-y-3">
          {affiliates.map((a) => (
            <Card key={a.id} className="flex items-center justify-between">
              <div>
                <div className="font-medium text-white">{a.name}</div>
                <div className="text-sm text-slate-500">{a.email}</div>
                <code className="text-xs text-indigo-400">?ref={a.code}</code>
              </div>
              <div className="text-right">
                <Badge>{a.commissionRate}% commission</Badge>
                <div className="mt-1 text-sm text-slate-500">{a._count.referrals} referrals</div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <Card className="mt-6">
        <h3 className="font-medium text-white">Affiliate Best Practices</h3>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-400">
          <li>Offer 20-30% recurring commission for SaaS referrals</li>
          <li>Provide affiliates with pre-built snapshot templates</li>
          <li>Track conversions via unique ref codes on signup</li>
          <li>Pay out monthly via PayPal or Stripe Connect</li>
        </ul>
      </Card>
    </div>
  );
}
