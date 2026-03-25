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
  // Original modal packs
  starter: {
    priceId: process.env.STRIPE_STARTER_PRICE_ID || "",
    credits: 100,
    amountCents: 499,
  },
  pro: {
    priceId: process.env.STRIPE_PRO_PRICE_ID || "",
    credits: 200,
    amountCents: 999,
  },
  // Slot modal packs
  mini: {
    priceId: process.env.STRIPE_MINI_PRICE_ID || "",
    credits: 30,
    amountCents: 199,
  },
  value: {
    priceId: process.env.STRIPE_VALUE_PRICE_ID || "",
    credits: 100,
    amountCents: 499,
  },
  power: {
    priceId: process.env.STRIPE_POWER_PRICE_ID || "",
    credits: 200,
    amountCents: 999,
  },
};
