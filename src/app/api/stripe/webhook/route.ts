import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { emitEvent } from "@/lib/event-bus";
import { triggerWorkflows } from "@/lib/automations";

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 400 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !secret) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    return NextResponse.json({ error: `Webhook error: ${err}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const productId = session.metadata?.productId;
    const organizationId = session.metadata?.organizationId;
    const email = session.customer_email || session.customer_details?.email;

    if (productId && email) {
      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (product) {
        await prisma.payment.create({
          data: {
            productId,
            contactEmail: email,
            amount: product.price,
            currency: product.currency,
            stripePaymentId: session.id,
            status: "succeeded",
          },
        });

        if (organizationId) {
          await emitEvent(organizationId, "payment.received", { email, productId, amount: product.price });
          await triggerWorkflows(organizationId, "payment_received", {
            contactEmail: email,
            data: { productId, sessionId: session.id },
          });
        }
      }
    }
  }

  if (event.type === "customer.subscription.created") {
    const sub = event.data.object;
    await emitEvent("system", "subscription.created", { subscriptionId: sub.id, customerId: sub.customer });
  }

  return NextResponse.json({ received: true });
}
