import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { parseJson } from "@/lib/utils";

export default async function FunnelPage({
  params,
}: {
  params: Promise<{ orgSlug: string; funnelSlug: string }>;
}) {
  const { orgSlug, funnelSlug } = await params;

  const org = await prisma.organization.findUnique({ where: { slug: orgSlug } });
  if (!org) notFound();

  const funnel = await prisma.funnel.findUnique({
    where: { organizationId_slug: { organizationId: org.id, slug: funnelSlug } },
    include: { pages: { orderBy: { order: "asc" } } },
  });
  if (!funnel || funnel.pages.length === 0) notFound();

  const page = funnel.pages[0];
  const content = parseJson<{ blocks: Array<{ type: string; headline?: string; subheadline?: string; cta?: string; content?: string; items?: string[] }> }>(
    page.content,
    { blocks: [] }
  );

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {funnel.customCss && <style dangerouslySetInnerHTML={{ __html: funnel.customCss }} />}
      {funnel.customHtml && <div dangerouslySetInnerHTML={{ __html: funnel.customHtml }} />}
      {content.blocks.map((block, i) => {
        if (block.type === "hero") {
          return (
            <section key={i} className="bg-indigo-600 px-6 py-24 text-center text-white">
              <h1 className="text-4xl font-bold">{block.headline}</h1>
              <p className="mt-4 text-xl opacity-90">{block.subheadline}</p>
              <button className="mt-8 rounded-lg bg-white px-8 py-3 font-semibold text-indigo-600">
                {block.cta || "Get Started"}
              </button>
            </section>
          );
        }
        if (block.type === "features") {
          return (
            <section key={i} className="px-6 py-16">
              <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
                {(block.items || []).map((item, j) => (
                  <div key={j} className="rounded-xl border p-6 text-center">
                    <div className="text-lg font-medium">{item}</div>
                  </div>
                ))}
              </div>
            </section>
          );
        }
        return (
          <section key={i} className="px-6 py-8 text-center">
            <p>{block.content}</p>
          </section>
        );
      })}
      {funnel.customJs && <script dangerouslySetInnerHTML={{ __html: funnel.customJs }} />}
    </div>
  );
}
