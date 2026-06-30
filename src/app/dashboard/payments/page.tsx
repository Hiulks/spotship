"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card, Button, EmptyState } from "@/components/ui";

export default function PaymentsPage() {
  const [products, setProducts] = useState<Array<{ id: string; name: string; price: number; currency: string; interval: string | null; _count: { payments: number; subscriptions: number } }>>([]);

  async function load() {
    const res = await fetch("/api/products");
    setProducts(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function createProduct() {
    await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Starter Plan",
        description: "Full platform access",
        price: 97,
        currency: "usd",
        interval: "month",
      }),
    });
    load();
  }

  return (
    <div>
      <PageHeader title="Payments & Subscriptions" description="Stripe products, one-time payments, and recurring subscriptions" action={<Button onClick={createProduct}>New Product</Button>} />
      {products.length === 0 ? (
        <EmptyState title="No products" description="Add Stripe products to start accepting payments" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {products.map((p) => (
            <Card key={p.id}>
              <h3 className="font-medium text-white">{p.name}</h3>
              <div className="mt-1 text-2xl font-semibold text-green-400">
                ${p.price}<span className="text-sm text-slate-500">/{p.interval || "one-time"}</span>
              </div>
              <p className="mt-2 text-sm text-slate-500">{p._count.payments} payments · {p._count.subscriptions} subscriptions</p>
            </Card>
          ))}
        </div>
      )}
      <Card className="mt-6">
        <h3 className="font-medium text-white">Stripe Setup</h3>
        <p className="mt-2 text-sm text-slate-400">
          Add your Stripe keys to <code className="text-indigo-400">.env</code> to enable live payments.
          Without keys, payments run in demo mode for testing.
        </p>
      </Card>
    </div>
  );
}
