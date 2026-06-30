"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card, Button, EmptyState } from "@/components/ui";

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Array<{ id: string; email: string; firstName: string | null; lastName: string | null; phone: string | null; source: string | null; createdAt: string }>>([]);

  useEffect(() => {
    fetch("/api/contacts").then((r) => r.json()).then(setContacts);
  }, []);

  async function addContact() {
    const email = prompt("Email:");
    if (!email) return;
    await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, firstName: "New", lastName: "Contact" }),
    });
    const res = await fetch("/api/contacts");
    setContacts(await res.json());
  }

  return (
    <div>
      <PageHeader title="Contacts" description="Your CRM contact database" action={<Button onClick={addContact}>Add Contact</Button>} />
      {contacts.length === 0 ? (
        <EmptyState title="No contacts" description="Contacts are created from forms, imports, or manually" />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-slate-400">
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Phone</th>
                <th className="p-4">Source</th>
                <th className="p-4">Created</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id} className="border-b border-slate-800/50 text-slate-300">
                  <td className="p-4">{c.firstName} {c.lastName}</td>
                  <td className="p-4">{c.email}</td>
                  <td className="p-4">{c.phone || "—"}</td>
                  <td className="p-4">{c.source || "—"}</td>
                  <td className="p-4">{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
