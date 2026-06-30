import { NextRequest } from "next/server";
import { withAuth, jsonOk } from "@/lib/api";
import { prisma } from "@/lib/db";
import { createStripeProduct, createCheckoutSession } from "@/lib/stripe";

export async function GET() {
  return withAuth(async (session) => {
    const products = await prisma.product.findMany({
      where: { organizationId: session.organizationId },
      include: { _count: { select: { subscriptions: true, payments: true } } },
    });
    return jsonOk(products);
  });
}

export async function POST(req: NextRequest) {
  return withAuth(async (session) => {
    const body = await req.json();

    if (body.action === "checkout") {
      const result = await createCheckoutSession(
        body.productId,
        body.email,
        body.successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`,
        body.cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancel`
      );
      return jsonOk(result);
    }

    const product = await createStripeProduct(session.organizationId, {
      name: body.name,
      description: body.description,
      price: body.price,
      currency: body.currency || "usd",
      interval: body.interval,
    });
    return jsonOk(product);
  });
}
