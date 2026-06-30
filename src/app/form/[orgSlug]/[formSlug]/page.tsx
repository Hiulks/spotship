import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import PublicForm from "./PublicForm";

export default async function PublicFormPage({
  params,
}: {
  params: Promise<{ orgSlug: string; formSlug: string }>;
}) {
  const { orgSlug, formSlug } = await params;

  const org = await prisma.organization.findUnique({ where: { slug: orgSlug } });
  if (!org) notFound();

  const form = await prisma.form.findUnique({
    where: { organizationId_slug: { organizationId: org.id, slug: formSlug } },
    include: { fields: { orderBy: { order: "asc" } } },
  });
  if (!form) notFound();

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-16">
      <div className="mx-auto max-w-lg">
        <h1 className="mb-8 text-2xl font-semibold text-white">{form.name}</h1>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <PublicForm orgSlug={orgSlug} formSlug={formSlug} fields={form.fields} thankYou={form.thankYouMsg} />
        </div>
      </div>
    </div>
  );
}
