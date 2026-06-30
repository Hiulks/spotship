import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("demo1234", 12);

  const user = await prisma.user.upsert({
    where: { email: "demo@spotship.io" },
    update: {},
    create: { email: "demo@spotship.io", passwordHash, name: "Demo User", role: "owner" },
  });

  let org = await prisma.organization.findFirst({ where: { slug: "demo" } });

  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: "Demo Agency",
        slug: "demo",
        plan: "agency",
        whiteLabel: { create: { brandName: "Demo Agency", primaryColor: "#6366f1" } },
        saasConfig: { create: { enabled: true, resellerName: "Demo Agency", maxSubAccounts: 100 } },
      },
    });
    await prisma.membership.create({ data: { userId: user.id, organizationId: org.id, role: "owner" } });
  }

  const orgId = org.id;

  let pipeline = await prisma.pipeline.findFirst({
    where: { organizationId: orgId, name: "Sales Pipeline" },
    include: { stages: true },
  });
  if (!pipeline) {
    pipeline = await prisma.pipeline.create({
      data: {
        organizationId: orgId,
        name: "Sales Pipeline",
        stages: {
          create: [
            { name: "New Lead", order: 0, color: "#6366f1" },
            { name: "Qualified", order: 1, color: "#8b5cf6" },
            { name: "Proposal", order: 2, color: "#a855f7" },
            { name: "Won", order: 3, color: "#22c55e" },
            { name: "Lost", order: 4, color: "#ef4444" },
          ],
        },
      },
      include: { stages: true },
    });
  }

  let company = await prisma.company.findFirst({ where: { organizationId: orgId, name: "Acme Corp" } });
  if (!company) {
    company = await prisma.company.create({
      data: { organizationId: orgId, name: "Acme Corp", website: "https://acme.example", industry: "SaaS" },
    });
  }

  const contact = await prisma.contact.upsert({
    where: { organizationId_email: { organizationId: orgId, email: "lead@example.com" } },
    update: { companyId: company.id },
    create: {
      organizationId: orgId,
      companyId: company.id,
      email: "lead@example.com",
      firstName: "Jane",
      lastName: "Smith",
      phone: "+15551234567",
      source: "seed",
      tags: JSON.stringify(["vip", "demo"]),
    },
  });

  const existingOpp = await prisma.opportunity.findFirst({ where: { contactId: contact.id } });
  if (!existingOpp && pipeline.stages[0]) {
    await prisma.opportunity.create({
      data: { contactId: contact.id, stageId: pipeline.stages[0].id, title: "Website Redesign", value: 5000 },
    });
  }

  if (!(await prisma.funnel.findFirst({ where: { organizationId: orgId, slug: "lead-gen" } }))) {
    await prisma.funnel.create({
      data: {
        organizationId: orgId,
        name: "Lead Generation Funnel",
        slug: "lead-gen",
        status: "published",
        customCss: ".hero { background: linear-gradient(135deg, #6366f1, #8b5cf6); }",
        pages: {
          create: [{
            name: "Landing", slug: "landing", order: 0,
            content: JSON.stringify({
              blocks: [
                { type: "hero", headline: "Grow Your Business", subheadline: "All-in-one marketing platform", cta: "Start Free Trial" },
                { type: "features", items: ["Funnels", "CRM", "Automations"] },
              ],
            }),
          }],
        },
      },
    });
  }

  if (!(await prisma.form.findFirst({ where: { organizationId: orgId, slug: "contact" } }))) {
    await prisma.form.create({
      data: {
        organizationId: orgId,
        name: "Contact Form",
        slug: "contact",
        fields: {
          create: [
            { label: "First Name", type: "text", required: true, order: 0 },
            { label: "Email", type: "email", required: true, order: 1 },
            { label: "Phone", type: "tel", order: 2 },
          ],
        },
      },
    });
  }

  if (!(await prisma.workflow.findFirst({ where: { organizationId: orgId, name: "New Lead Automation" } }))) {
    await prisma.workflow.create({
      data: {
        organizationId: orgId,
        name: "New Lead Automation",
        trigger: "form_submit",
        status: "active",
        steps: {
          create: [
            { type: "add_tag", config: JSON.stringify({ tag: "new-lead" }), order: 0 },
            { type: "send_email", config: JSON.stringify({ subject: "Welcome!", body: "Thanks for reaching out. We will be in touch soon." }), order: 1 },
            { type: "send_sms", config: JSON.stringify({ message: "We received your inquiry!" }), order: 2 },
          ],
        },
      },
    });
  }

  if (!(await prisma.calendar.findFirst({ where: { organizationId: orgId, slug: "discovery-call" } }))) {
    await prisma.calendar.create({
      data: {
        organizationId: orgId,
        name: "Discovery Call",
        slug: "discovery-call",
        duration: 30,
        slots: {
          create: [
            { dayOfWeek: 1, startTime: "09:00", endTime: "17:00" },
            { dayOfWeek: 2, startTime: "09:00", endTime: "17:00" },
            { dayOfWeek: 3, startTime: "09:00", endTime: "17:00" },
            { dayOfWeek: 4, startTime: "09:00", endTime: "17:00" },
            { dayOfWeek: 5, startTime: "09:00", endTime: "17:00" },
          ],
        },
      },
    });
  }

  if (!(await prisma.product.findFirst({ where: { organizationId: orgId, name: "Agency Plan" } }))) {
    await prisma.product.create({
      data: { organizationId: orgId, name: "Agency Plan", description: "Full platform access", price: 297, currency: "usd", interval: "month" },
    });
  }

  if (!(await prisma.course.findFirst({ where: { organizationId: orgId } }))) {
    const course = await prisma.course.create({
      data: { organizationId: orgId, name: "Agency Masterclass", description: "Learn to ship clients fast", modules: JSON.stringify(["Module 1", "Module 2"]), status: "published" },
    });
    await prisma.membershipPlan.create({
      data: { organizationId: orgId, courseId: course.id, name: "VIP Access", contactEmail: "lead@example.com", status: "active" },
    });
  }

  if (!(await prisma.task.findFirst({ where: { organizationId: orgId } }))) {
    await prisma.task.create({
      data: { organizationId: orgId, contactId: contact.id, title: "Follow up with Jane", status: "open", priority: "high" },
    });
    await prisma.note.create({
      data: { organizationId: orgId, contactId: contact.id, content: "Interested in full funnel + CRM package." },
    });
  }

  if (!(await prisma.cronJob.findFirst({ where: { organizationId: orgId } }))) {
    await prisma.cronJob.createMany({
      data: [
        { organizationId: orgId, name: "Daily Backup", schedule: "daily", action: "backup", status: "active" },
        { organizationId: orgId, name: "Sync Contacts", schedule: "every_5_minutes", action: "sync_contacts", status: "active" },
        { organizationId: orgId, name: "Weekly Log Cleanup", schedule: "daily", action: "cleanup_logs", status: "active" },
      ],
    });
  }

  if (!(await prisma.tag.findFirst({ where: { organizationId: orgId, name: "vip" } }))) {
    await prisma.tag.create({ data: { organizationId: orgId, name: "vip", color: "#f59e0b" } });
    await prisma.tag.create({ data: { organizationId: orgId, name: "new-lead", color: "#6366f1" } });
  }

  if (!(await prisma.customField.findFirst({ where: { organizationId: orgId, key: "budget" } }))) {
    await prisma.customField.create({ data: { organizationId: orgId, name: "Budget", key: "budget", type: "number" } });
  }

  if (!(await prisma.affiliate.findFirst({ where: { organizationId: orgId } }))) {
    await prisma.affiliate.create({
      data: { organizationId: orgId, name: "Partner Referral", email: "partner@example.com", code: "PARTNER20", commissionRate: 20 },
    });
  }

  const folder = await prisma.accountFolder.findFirst({ where: { name: "Active Clients" } });
  if (!folder) {
    const f = await prisma.accountFolder.create({ data: { name: "Active Clients", color: "#22c55e" } });
    await prisma.organization.update({ where: { id: orgId }, data: { folderId: f.id } });
  }

  console.log("Seed complete!");
  console.log("Login: demo@spotship.io / demo1234");
  console.log("Org slug: demo");
  console.log("Form: /form/demo/contact");
  console.log("Funnel: /funnel/demo/lead-gen");
  console.log("Calendar: /calendar/demo/discovery-call");
}

main().catch(console.error).finally(() => prisma.$disconnect());
