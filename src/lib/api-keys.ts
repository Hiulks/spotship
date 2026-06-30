import crypto from "crypto";
import { prisma } from "./db";

export function generateApiKey(): { key: string; prefix: string; hash: string } {
  const key = `ss_${crypto.randomBytes(24).toString("hex")}`;
  const prefix = key.slice(0, 10);
  const hash = crypto.createHash("sha256").update(key).digest("hex");
  return { key, prefix, hash };
}

export async function createApiKey(organizationId: string, name: string) {
  const { key, prefix, hash } = generateApiKey();
  await prisma.apiKey.create({
    data: { organizationId, name, keyHash: hash, prefix },
  });
  return { key, prefix };
}

export async function verifyApiKey(key: string) {
  const hash = crypto.createHash("sha256").update(key).digest("hex");
  const record = await prisma.apiKey.findUnique({ where: { keyHash: hash } });
  if (!record) return null;
  await prisma.apiKey.update({ where: { id: record.id }, data: { lastUsedAt: new Date() } });
  return record;
}
