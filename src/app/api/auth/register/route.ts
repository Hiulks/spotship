import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, signToken } from "@/lib/auth";
import { slugify } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const { email, password, name, organizationName } = await req.json();

  if (!email || !password || !name || !organizationName) {
    return NextResponse.json({ error: "All fields required" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const slug = slugify(organizationName) + "-" + Date.now().toString(36);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role: "owner",
      memberships: {
        create: {
          role: "owner",
          organization: {
            create: {
              name: organizationName,
              slug,
              whiteLabel: {
                create: { brandName: organizationName },
              },
              saasConfig: { create: {} },
            },
          },
        },
      },
    },
    include: {
      memberships: { include: { organization: true } },
    },
  });

  const membership = user.memberships[0];
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
