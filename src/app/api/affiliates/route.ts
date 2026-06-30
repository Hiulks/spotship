import { NextRequest } from "next/server";
import { withAuth, jsonOk } from "@/lib/api";
import { prisma } from "@/lib/db";

export async function GET() {
  return withAuth(async (session) => {
    const affiliates = await prisma.affiliate.findMany({
      where: { organizationId: session.organizationId },
      include: { _count: { select: { referrals: true } } },
    });
    return jsonOk(affiliates);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (session) => {
    const body = await req.json();
    const code = body.code || body.name.toLowerCase().replace(/\s+/g, "").slice(0, 8) + Date.now().toString(36);
    const affiliate = await prisma.affiliate.create({
      data: {
        organizationId: session.organizationId,
        name: body.name,
        email: body.email,
        code,
        commissionRate: body.commissionRate || 20,
        payoutEmail: body.payoutEmail || body.email,
      },
    });
    return jsonOk(affiliate);
  });
}
