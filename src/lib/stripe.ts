import Stripe from "stripe";
import { prisma } from "./db";

const stripeKey = process.env.STRIPE_SECRET_KEY;

export const stripe = stripeKey
  ? new Stripe(stripeKey)
  : null;

export async function createStripeProduct(
  organizationId: string,
  product: { name: string; description?: string; price: number; currency: string; interval?: string }
) {
  if (!stripe) {
    return prisma.product.create({
      data: {
        organizationId,
        name: product.name,
        description: product.description,
        price: product.price,
        currency: product.currency,
        interval: product.interval,
      },
    });
  }

  const stripeProduct = await stripe.products.create({
    name: product.name,
    description: product.description,
    metadata: { organizationId },
  });

  const priceData: Stripe.PriceCreateParams = {
    product: stripeProduct.id,
    unit_amount: Math.round(product.price * 100),
    currency: product.currency,
  };

  if (product.interval && product.interval !== "one_time") {
    priceData.recurring = { interval: product.interval as "month" | "year" };
  }

  const stripePrice = await stripe.prices.create(priceData);

  return prisma.product.create({
    data: {
      organizationId,
      name: product.name,
      description: product.description,
      price: product.price,
      currency: product.currency,
      interval: product.interval,
      stripeProductId: stripeProduct.id,
      stripePriceId: stripePrice.id,
    },
  });
}

export async function createCheckoutSession(
  productId: string,
  customerEmail: string,
  successUrl: string,
  cancelUrl: string
) {
  const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });

  if (!stripe || !product.stripePriceId) {
    await prisma.payment.create({
      data: {
        productId,
        contactEmail: customerEmail,
        amount: product.price,
        currency: product.currency,
        status: "demo_mode",
      },
    });
    return { url: successUrl, demo: true };
  }

  const session = await stripe.checkout.sessions.create({
    mode: product.interval ? "subscription" : "payment",
    customer_email: customerEmail,
    line_items: [{ price: product.stripePriceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { productId, organizationId: product.organizationId },
  });

  return { url: session.url, sessionId: session.id };
}
