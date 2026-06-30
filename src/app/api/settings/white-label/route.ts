import { NextRequest } from "next/server";
import { withAuth, jsonOk } from "@/lib/api";
import { prisma } from "@/lib/db";

export async function GET() {
  return withAuth(async (session) => {
    const config = await prisma.whiteLabelConfig.findUnique({
      where: { organizationId: session.organizationId },
    });
    const saas = await prisma.saasConfig.findUnique({
      where: { organizationId: session.organizationId },
    });
    return jsonOk({ whiteLabel: config, saas });
  });
}

export async function PUT(req: NextRequest) {
  return withAuth(async (session) => {
    const body = await req.json();

    const whiteLabel = await prisma.whiteLabelConfig.upsert({
      where: { organizationId: session.organizationId },
      create: { organizationId: session.organizationId, brandName: body.brandName || "My Brand", ...body },
      update: body,
    });

    if (body.saas) {
      await prisma.saasConfig.upsert({
        where: { organizationId: session.organizationId },
        create: { organizationId: session.organizationId, ...body.saas },
        update: body.saas,
      });
    }

    return jsonOk(whiteLabel);
  });
}
