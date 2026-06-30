import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function withAuth(
  handler: (session: NonNullable<Awaited<ReturnType<typeof getSession>>>) => Promise<NextResponse>
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return handler(session);
}

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
