"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    organizationName: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Registration failed");
      setLoading(false);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md">
        <h1 className="mb-8 text-center text-2xl font-semibold text-white">Create your SpotShip account</h1>
        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4">
          {error && <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
          {(["name", "email", "password", "organizationName"] as const).map((field) => (
            <label key={field} className="block">
              <span className="mb-1 block text-sm text-slate-400 capitalize">
                {field === "organizationName" ? "Business name" : field}
              </span>
              <input
                type={field === "password" ? "password" : field === "email" ? "email" : "text"}
                required
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-indigo-500"
              />
            </label>
          ))}
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Get started"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="text-indigo-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
