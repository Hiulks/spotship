import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { signToken, verifyPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const user = await prisma.user.findUnique({
    where: { email },
    include: { memberships: { include: { organization: true } } },
  });

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const membership = user.memberships[0];
  if (!membership) {
    return NextResponse.json({ error: "No organization found" }, { status: 403 });
  }

  const token = signToken({
    id: user.id,
    email: user.email,
    name: user.name,
    organizationId: membership.organizationId,
    organizationSlug: membership.organization.slug,
    role: membership.role,
  });

  const response = NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name },
    organization: membership.organization,
  });

  response.cookies.set("spotship_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return response;
}
