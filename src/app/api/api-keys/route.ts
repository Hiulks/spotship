import { withAuth, jsonOk } from "@/lib/api";
import { createApiKey } from "@/lib/api-keys";
import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

export async function GET() {
  return withAuth(async (session) => {
    const keys = await prisma.apiKey.findMany({
      where: { organizationId: session.organizationId },
      select: { id: true, name: true, prefix: true, lastUsedAt: true, createdAt: true },
    });
    return jsonOk(keys);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (session) => {
    const { name } = await req.json();
    const result = await createApiKey(session.organizationId, name || "API Key");
    return jsonOk({ ...result, warning: "Save this key now — it won't be shown again" });
  });
}
