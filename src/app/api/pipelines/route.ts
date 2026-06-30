import { NextRequest } from "next/server";
import { withAuth, jsonOk } from "@/lib/api";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";

export async function GET() {
  return withAuth(async (session) => {
    const pipelines = await prisma.pipeline.findMany({
      where: { organizationId: session.organizationId },
      include: {
        stages: { orderBy: { order: "asc" }, include: { _count: { select: { opportunities: true } } } },
      },
    });
    return jsonOk(pipelines);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (session) => {
    const body = await req.json();
    const pipeline = await prisma.pipeline.create({
      data: {
        organizationId: session.organizationId,
        name: body.name,
        stages: {
          create: (body.stages || [
            { name: "New Lead", order: 0, color: "#6366f1" },
            { name: "Qualified", order: 1, color: "#8b5cf6" },
            { name: "Proposal", order: 2, color: "#a855f7" },
            { name: "Won", order: 3, color: "#22c55e" },
            { name: "Lost", order: 4, color: "#ef4444" },
          ]).map((s: { name: string; order: number; color?: string }, i: number) => ({
            name: s.name,
            order: s.order ?? i,
            color: s.color || "#6366f1",
          })),
        },
      },
      include: { stages: true },
    });
    return jsonOk(pipeline);
  });
}
