import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import { prisma } from "./db";
import { emitEvent } from "./event-bus";

const OUTBOX_DIR = path.join(process.cwd(), "data", "outbox");

function ensureOutbox() {
  if (!fs.existsSync(OUTBOX_DIR)) fs.mkdirSync(OUTBOX_DIR, { recursive: true });
}

async function getTransporter() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;
  return nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
}

export async function sendEmail(params: {
  organizationId: string;
  to: string;
  subject: string;
  body: string;
  contactId?: string;
}) {
  ensureOutbox();
  const file = path.join(OUTBOX_DIR, `email-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
  const payload = { ...params, sentAt: new Date().toISOString() };
  fs.writeFileSync(file, JSON.stringify(payload, null, 2));

  const transporter = await getTransporter();
  let status = "queued";

  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || "noreply@spotship.local",
        to: params.to,
        subject: params.subject,
        text: params.body,
        html: `<p>${params.body.replace(/\n/g, "<br>")}</p>`,
      });
      status = "sent";
    } catch (e) {
      status = "failed";
      console.error("SMTP error:", e);
    }
  } else {
    status = "simulated";
    console.log(`[EMAIL] To: ${params.to} | ${params.subject}`);
  }

  const log = await prisma.messageLog.create({
    data: {
      organizationId: params.organizationId,
      contactId: params.contactId,
      channel: "email",
      to: params.to,
      subject: params.subject,
      body: params.body,
      status,
    },
  });

  await emitEvent(params.organizationId, "message.sent", { channel: "email", messageId: log.id, to: params.to });
  return log;
}

export async function sendSms(params: {
  organizationId: string;
  to: string;
  message: string;
  contactId?: string;
}) {
  ensureOutbox();
  const file = path.join(OUTBOX_DIR, `sms-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
  fs.writeFileSync(file, JSON.stringify({ ...params, sentAt: new Date().toISOString() }, null, 2));

  let status = "simulated";
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;

  if (sid && token && from) {
    try {
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({ To: params.to, From: from, Body: params.message }),
        }
      );
      status = res.ok ? "sent" : "failed";
    } catch {
      status = "failed";
    }
  } else {
    console.log(`[SMS] To: ${params.to} | ${params.message}`);
  }

  const log = await prisma.messageLog.create({
    data: {
      organizationId: params.organizationId,
      contactId: params.contactId,
      channel: "sms",
      to: params.to,
      body: params.message,
      status,
    },
  });

  await emitEvent(params.organizationId, "message.sent", { channel: "sms", messageId: log.id, to: params.to });
  return log;
}
