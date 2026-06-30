"use client";

import { useState } from "react";

export default function PublicForm({
  orgSlug,
  formSlug,
  fields,
  thankYou,
}: {
  orgSlug: string;
  formSlug: string;
  fields: Array<{ label: string; type: string; required: boolean }>;
  thankYou: string;
}) {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data: Record<string, string> = {};
    formData.forEach((value, key) => { data[key] = value.toString(); });

    const res = await fetch(`/api/public/${orgSlug}/forms/${formSlug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) setSubmitted(true);
    setLoading(false);
  }

  if (submitted) {
    return <div className="text-center text-xl text-green-400">{thankYou}</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map((field) => (
        <label key={field.label} className="block">
          <span className="mb-1 block text-sm text-slate-400">
            {field.label}{field.required && " *"}
          </span>
          <input
            name={field.label.toLowerCase().replace(/\s+/g, "_")}
            type={field.type}
            required={field.required}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-indigo-500"
          />
        </label>
      ))}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-indigo-600 py-3 font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}
