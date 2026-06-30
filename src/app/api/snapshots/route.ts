import { NextRequest } from "next/server";
import { withAuth, jsonOk, jsonError } from "@/lib/api";
import { prisma } from "@/lib/db";
import {
  exportSnapshot,
  importSnapshot,
  cloneOrganization,
  createBackup,
  restoreBackup,
} from "@/lib/snapshots";
import type { SnapshotPayload } from "@/lib/snapshots";

export async function GET() {
  return withAuth(async (session) => {
    const snapshots = await prisma.snapshot.findMany({
      where: { organizationId: session.organizationId },
      orderBy: { createdAt: "desc" },
    });
    return jsonOk(snapshots);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (session) => {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "export": {
        const payload = await exportSnapshot(session.organizationId);
        const snapshot = await prisma.snapshot.create({
          data: {
            organizationId: session.organizationId,
            name: body.name || `Snapshot ${new Date().toLocaleDateString()}`,
            description: body.description,
            payload: JSON.stringify(payload),
            isTemplate: body.isTemplate || false,
          },
        });
        return jsonOk({ snapshot, payload });
      }

      case "import": {
        const payload = body.payload as SnapshotPayload;
        if (!payload?.version) return jsonError("Invalid snapshot payload");
        const result = await importSnapshot(session.organizationId, payload);
        return jsonOk(result);
      }

      case "backup": {
        const backup = await createBackup(
          session.organizationId,
          body.name || `Backup ${new Date().toLocaleString()}`
        );
        return jsonOk(backup);
      }

      case "restore": {
        if (!body.snapshotId) return jsonError("snapshotId required");
        const result = await restoreBackup(body.snapshotId, session.organizationId);
        return jsonOk(result);
      }

      case "clone": {
        if (!body.name || !body.slug) return jsonError("name and slug required");
        const org = await cloneOrganization(session.organizationId, body.name, body.slug);
        return jsonOk(org);
      }

      default:
        return jsonError("Unknown action");
    }
  });
}
