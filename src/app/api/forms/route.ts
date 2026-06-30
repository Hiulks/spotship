import { NextRequest } from "next/server";
import { withAuth, jsonOk } from "@/lib/api";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";

export async function GET() {
  return withAuth(async (session) => {
    const forms = await prisma.form.findMany({
      where: { organizationId: session.organizationId },
      include: { fields: { orderBy: { order: "asc" } }, _count: { select: { submissions: true } } },
    });
    return jsonOk(forms);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (session) => {
    const body = await req.json();
    const form = await prisma.form.create({
      data: {
        organizationId: session.organizationId,
        name: body.name,
        slug: body.slug || slugify(body.name),
        thankYouMsg: body.thankYouMsg,
        fields: body.fields
          ? {
              create: body.fields.map(
                (f: { label: string; type: string; required?: boolean; order?: number }, i: number) => ({
                  label: f.label,
                  type: f.type || "text",
                  required: f.required || false,
                  order: f.order ?? i,
                })
              ),
            }
          : undefined,
      },
      include: { fields: true },
    });
    return jsonOk(form);
  });
}
