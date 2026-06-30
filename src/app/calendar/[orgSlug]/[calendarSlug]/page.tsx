"use client";

import { useEffect, useState } from "react";

export default function CalendarBookingPage({
  params,
}: {
  params: Promise<{ orgSlug: string; calendarSlug: string }>;
}) {
  const [orgSlug, setOrgSlug] = useState("");
  const [calendarSlug, setCalendarSlug] = useState("");
  const [calendar, setCalendar] = useState<{ name: string; duration: number } | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", startsAt: "" });
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    params.then((p) => {
      setOrgSlug(p.orgSlug);
      setCalendarSlug(p.calendarSlug);
      fetch(`/api/public/${p.orgSlug}/calendar/${p.calendarSlug}`)
        .then((r) => r.json())
        .then(setCalendar);
    });
  }, [params]);

  async function book(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch(`/api/public/${orgSlug}/calendar/${calendarSlug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) setDone(true);
    setLoading(false);
  }

  if (!calendar) return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">Loading...</div>;

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center text-green-400 text-xl">Appointment booked!</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <form onSubmit={book} className="w-full max-w-md space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h1 className="text-xl font-semibold text-white">{calendar.name}</h1>
        <p className="text-sm text-slate-400">{calendar.duration} minute meeting</p>
        {(["name", "email", "phone"] as const).map((f) => (
          <label key={f} className="block">
            <span className="mb-1 block text-sm text-slate-400 capitalize">{f}</span>
            <input
              required={f !== "phone"}
              type={f === "email" ? "email" : "text"}
              value={form[f]}
              onChange={(e) => setForm({ ...form, [f]: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            />
          </label>
        ))}
        <label className="block">
          <span className="mb-1 block text-sm text-slate-400">Date & Time</span>
          <input
            required
            type="datetime-local"
            value={form.startsAt}
            onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
          />
        </label>
        <button type="submit" disabled={loading} className="w-full rounded-lg bg-indigo-600 py-3 text-white hover:bg-indigo-500 disabled:opacity-50">
          {loading ? "Booking..." : "Book Appointment"}
        </button>
      </form>
    </div>
  );
}
