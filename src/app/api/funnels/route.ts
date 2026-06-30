import { NextRequest } from "next/server";
import { withAuth, jsonOk, jsonError } from "@/lib/api";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";

export async function GET() {
  return withAuth(async (session) => {
    const funnels = await prisma.funnel.findMany({
      where: { organizationId: session.organizationId },
      include: { pages: { orderBy: { order: "asc" } } },
      orderBy: { updatedAt: "desc" },
    });
    return jsonOk(funnels);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (session) => {
    const body = await req.json();
    const slug = body.slug || slugify(body.name);

    const funnel = await prisma.funnel.create({
      data: {
        organizationId: session.organizationId,
        name: body.name,
        slug,
        status: body.status || "draft",
        customCss: body.customCss,
        customHtml: body.customHtml,
        customJs: body.customJs,
        pages: body.pages
          ? {
              create: body.pages.map(
                (p: { name: string; slug: string; content: string; order?: number }, i: number) => ({
                  name: p.name,
                  slug: p.slug || slugify(p.name),
                  content: p.content || JSON.stringify({ blocks: [] }),
                  order: p.order ?? i,
                })
              ),
            }
          : undefined,
      },
      include: { pages: true },
    });

    return jsonOk(funnel);
  });
}
