"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card, Button, EmptyState } from "@/components/ui";

export default function CalendarsPage() {
  const [calendars, setCalendars] = useState<Array<{ id: string; name: string; slug: string; duration: number; slots: unknown[] }>>([]);

  async function load() {
    const res = await fetch("/api/resources");
    const data = await res.json();
    setCalendars(data.calendars);
  }

  useEffect(() => { load(); }, []);

  async function create() {
    await fetch("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "calendar", name: "Discovery Call", duration: 30 }),
    });
    load();
  }

  return (
    <div>
      <PageHeader title="Calendars" description="Booking calendars with availability slots" action={<Button onClick={create}>New Calendar</Button>} />
      {calendars.length === 0 ? (
        <EmptyState title="No calendars" description="Set up a booking calendar for appointments" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {calendars.map((c) => (
            <Card key={c.id}>
              <h3 className="font-medium text-white">{c.name}</h3>
              <p className="text-sm text-slate-500">{c.duration} min · {(c.slots as unknown[]).length} slot rules</p>
              <a href={`/calendar/demo/${c.slug}`} target="_blank" className="mt-2 inline-block text-sm text-indigo-400 hover:underline">
                Book →
              </a>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
