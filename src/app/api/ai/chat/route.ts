import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { processAiMessage } from "@/lib/ai";
import { jsonOk, jsonError } from "@/lib/api";

export async function POST(req: NextRequest) {
  const { flowId, sessionId, message, contactId } = await req.json();
  if (!flowId || !message) return jsonError("flowId and message required");

  const result = await processAiMessage(flowId, sessionId, message, contactId);
  return jsonOk(result);
}
