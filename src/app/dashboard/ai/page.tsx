"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card, Button, EmptyState } from "@/components/ui";

export default function AiPage() {
  const [agents, setAgents] = useState<Array<{ id: string; name: string; status: string; flows: Array<{ id: string; name: string }> }>>([]);
  const [chat, setChat] = useState<{ sessionId?: string; messages: Array<{ role: string; content: string }> }>({ messages: [] });
  const [input, setInput] = useState("");
  const [flowId, setFlowId] = useState("");

  async function load() {
    const res = await fetch("/api/resources");
    const data = await res.json();
    setAgents(data.aiAgents);
    if (data.aiAgents[0]?.flows[0]) setFlowId(data.aiAgents[0].flows[0].id);
  }

  useEffect(() => { load(); }, []);

  async function createAgent() {
    await fetch("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "ai_agent",
        name: "Sales Assistant",
        systemPrompt: "You are a friendly sales assistant. Help visitors learn about our services and book appointments.",
        flow: {
          name: "Main Conversation",
          nodes: [
            { id: "1", type: "message", content: "Hi! How can I help you today?" },
            { id: "2", type: "message", content: "Our pricing starts at $97/month with full funnel + CRM included." },
          ],
        },
      }),
    });
    load();
  }

  async function sendMessage() {
    if (!input || !flowId) return;
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flowId, sessionId: chat.sessionId, message: input }),
    });
    const data = await res.json();
    setChat({ sessionId: data.sessionId, messages: data.messages });
    setInput("");
  }

  return (
    <div>
      <PageHeader title="AI Agents" description="Conversation flows and intelligent automation" action={<Button onClick={createAgent}>New Agent</Button>} />
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          {agents.length === 0 ? (
            <EmptyState title="No AI agents" description="Create an agent to handle conversations" />
          ) : (
            agents.map((a) => (
              <Card key={a.id} className="mb-3">
                <h3 className="font-medium text-white">{a.name}</h3>
                <p className="text-sm text-slate-500">{a.flows.length} conversation flows</p>
              </Card>
            ))
          )}
        </div>
        <Card>
          <h3 className="mb-4 font-medium text-white">Test Conversation</h3>
          <div className="mb-4 h-64 overflow-y-auto space-y-2 rounded-lg bg-slate-950 p-3">
            {chat.messages.map((m, i) => (
              <div key={i} className={`text-sm ${m.role === "user" ? "text-indigo-300" : "text-slate-300"}`}>
                <strong>{m.role}:</strong> {m.content}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type a message..."
              className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            />
            <Button onClick={sendMessage}>Send</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
