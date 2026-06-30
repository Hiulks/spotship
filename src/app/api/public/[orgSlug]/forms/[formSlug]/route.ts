import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { triggerWorkflows } from "@/lib/automations";
import { emitEvent } from "@/lib/event-bus";
import { jsonOk, jsonError } from "@/lib/api";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; formSlug: string }> }
) {
  const { orgSlug, formSlug } = await params;
  const data = await req.json();

  const org = await prisma.organization.findUnique({ where: { slug: orgSlug } });
  if (!org) return jsonError("Organization not found", 404);

  const form = await prisma.form.findUnique({
    where: { organizationId_slug: { organizationId: org.id, slug: formSlug } },
    include: { fields: true },
  });
  if (!form) return jsonError("Form not found", 404);

  const email = (data.email || data.Email) as string;
  if (!email) return jsonError("Email is required");

  const firstName = data.firstName || data.first_name || data["First Name"];
  const lastName = data.lastName || data.last_name || data["Last Name"];
  const phone = data.phone || data.Phone || data.tel;

  const contact = await prisma.contact.upsert({
    where: { organizationId_email: { organizationId: org.id, email } },
    create: {
      organizationId: org.id,
      email,
      firstName: firstName as string | undefined,
      lastName: lastName as string | undefined,
      phone: phone as string | undefined,
      source: `form:${form.slug}`,
      customData: JSON.stringify(data),
    },
    update: {
      firstName: (firstName as string) || undefined,
      lastName: (lastName as string) || undefined,
      phone: (phone as string) || undefined,
      customData: JSON.stringify(data),
    },
  });

  await prisma.formSubmission.create({
    data: { formId: form.id, contactId: contact.id, data: JSON.stringify(data) },
  });

  await emitEvent(org.id, "lead.created", { contact, formId: form.id, data });
  await emitEvent(org.id, "form.submitted", { formId: form.id, contact, data });

  await triggerWorkflows(org.id, "form_submit", {
    contactId: contact.id,
    contactEmail: contact.email,
    formId: form.id,
    data: { ...data, phone },
  });

  return jsonOk({ success: true, thankYou: form.thankYouMsg, contactId: contact.id });
}
