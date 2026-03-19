import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return _stripe;
}

export const CREDIT_PACKS: Record<
  string,
  { priceId: string; credits: number; amountCents: number }
> = {
  starter: {
    priceId: process.env.STRIPE_STARTER_PRICE_ID || "",
    credits: 30,
    amountCents: 500,
  },
  pro: {
    priceId: process.env.STRIPE_PRO_PRICE_ID || "",
    credits: 100,
    amountCents: 1200,
  },
};
