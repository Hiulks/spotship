"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card, Button, EmptyState } from "@/components/ui";

export default function SurveysPage() {
  const [surveys, setSurveys] = useState<Array<{ id: string; name: string; slug: string; questions: unknown[] }>>([]);

  async function load() {
    const res = await fetch("/api/resources");
    const data = await res.json();
    setSurveys(data.surveys);
  }

  useEffect(() => { load(); }, []);

  async function create() {
    await fetch("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "survey",
        name: "Customer Feedback",
        questions: [
          { question: "How satisfied are you?", type: "rating" },
          { question: "What can we improve?", type: "text" },
          { question: "Would you recommend us?", type: "yes_no" },
        ],
      }),
    });
    load();
  }

  return (
    <div>
      <PageHeader title="Surveys" description="Collect feedback with multi-question surveys" action={<Button onClick={create}>New Survey</Button>} />
      {surveys.length === 0 ? (
        <EmptyState title="No surveys" description="Create a survey to gather customer insights" />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {surveys.map((s) => (
            <Card key={s.id}>
              <h3 className="font-medium text-white">{s.name}</h3>
              <p className="text-sm text-slate-500">{(s.questions as unknown[]).length} questions</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
