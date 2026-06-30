import { prisma } from "./db";
import { parseJson } from "./utils";

interface FlowNode {
  id: string;
  type: "message" | "question" | "condition" | "action" | "end";
  content?: string;
  options?: string[];
  next?: string;
  branches?: Record<string, string>;
}

export async function processAiMessage(
  flowId: string,
  sessionId: string | null,
  userMessage: string,
  contactId?: string
) {
  const flow = await prisma.conversationFlow.findUniqueOrThrow({
    where: { id: flowId },
    include: { agent: true },
  });

  const nodes = parseJson<FlowNode[]>(flow.nodes, []);
  let session;

  if (sessionId) {
    session = await prisma.conversationSession.findUniqueOrThrow({ where: { id: sessionId } });
  } else {
    session = await prisma.conversationSession.create({
      data: { flowId, contactId, messages: "[]", status: "active" },
    });
  }

  const messages = parseJson<{ role: string; content: string }[]>(session.messages, []);
  messages.push({ role: "user", content: userMessage });

  const startNode = nodes.find((n) => n.type === "message") || nodes[0];
  let reply = startNode?.content || "How can I help you today?";

  if (userMessage.toLowerCase().includes("price") || userMessage.toLowerCase().includes("cost")) {
    const pricingNode = nodes.find((n) => n.content?.toLowerCase().includes("pricing"));
    reply = pricingNode?.content || "Our plans start at $97/month. Would you like to book a demo?";
  } else if (userMessage.toLowerCase().includes("book") || userMessage.toLowerCase().includes("schedule")) {
    reply = "Great! I can help you schedule a call. What day works best for you?";
  } else {
    reply = `Thanks for your message. ${flow.agent.systemPrompt ? "Based on our services, " : ""}A team member will follow up shortly. Is there anything else I can help with?`;
  }

  messages.push({ role: "assistant", content: reply });

  await prisma.conversationSession.update({
    where: { id: session.id },
    data: { messages: JSON.stringify(messages) },
  });

  return { sessionId: session.id, reply, messages };
}
