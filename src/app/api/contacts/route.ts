import { NextRequest } from "next/server";
import { withAuth, jsonOk } from "@/lib/api";
import { prisma } from "@/lib/db";

export async function GET() {
  return withAuth(async (session) => {
    const contacts = await prisma.contact.findMany({
      where: { organizationId: session.organizationId },
      orderBy: { createdAt: "desc" },
    });
    return jsonOk(contacts);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (session) => {
    const body = await req.json();
    const contact = await prisma.contact.create({
      data: {
        organizationId: session.organizationId,
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        tags: JSON.stringify(body.tags || []),
        source: body.source || "manual",
      },
    });
    return jsonOk(contact);
  });
}
