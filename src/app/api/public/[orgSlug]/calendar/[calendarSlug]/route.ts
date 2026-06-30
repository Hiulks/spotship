import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { triggerWorkflows } from "@/lib/automations";
import { emitEvent } from "@/lib/event-bus";
import { jsonOk, jsonError } from "@/lib/api";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; calendarSlug: string }> }
) {
  const { orgSlug, calendarSlug } = await params;
  const org = await prisma.organization.findUnique({ where: { slug: orgSlug } });
  if (!org) return jsonError("Organization not found", 404);

  const calendar = await prisma.calendar.findUnique({
    where: { organizationId_slug: { organizationId: org.id, slug: calendarSlug } },
    include: { slots: true },
  });
  if (!calendar) return jsonError("Calendar not found", 404);

  return jsonOk(calendar);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orgSlug: string; calendarSlug: string }> }
) {
  const { orgSlug, calendarSlug } = await params;
  const body = await req.json();

  const org = await prisma.organization.findUnique({ where: { slug: orgSlug } });
  if (!org) return jsonError("Organization not found", 404);

  const calendar = await prisma.calendar.findUnique({
    where: { organizationId_slug: { organizationId: org.id, slug: calendarSlug } },
  });
  if (!calendar) return jsonError("Calendar not found", 404);

  const { name, email, phone, startsAt } = body;
  if (!name || !email || !startsAt) return jsonError("name, email, startsAt required");

  const start = new Date(startsAt);
  const end = new Date(start.getTime() + calendar.duration * 60000);

  const contact = await prisma.contact.upsert({
    where: { organizationId_email: { organizationId: org.id, email } },
    create: { organizationId: org.id, email, firstName: name, phone, source: `calendar:${calendar.slug}` },
    update: { firstName: name, phone },
  });

  const appointment = await prisma.appointment.create({
    data: {
      calendarId: calendar.id,
      contactId: contact.id,
      name,
      email,
      phone,
      startsAt: start,
      endsAt: end,
    },
  });

  await emitEvent(org.id, "appointment.created", { appointment, contact });
  await triggerWorkflows(org.id, "appointment_booked", {
    contactId: contact.id,
    contactEmail: email,
    data: { appointmentId: appointment.id, startsAt },
  });

  return jsonOk({ success: true, appointment });
}
