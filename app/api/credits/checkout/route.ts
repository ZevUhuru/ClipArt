import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getStripe, CREDIT_PACKS } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Payments are not configured yet." },
        { status: 503 },
      );
    }

    const { packId } = await request.json();
    const pack = CREDIT_PACKS[packId];

    if (!pack || !pack.priceId) {
      return NextResponse.json({ error: "Invalid pack" }, { status: 400 });
    }

    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://clip.art";

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ price: pack.priceId, quantity: 1 }],
      metadata: {
        userId: user.id,
        credits: String(pack.credits),
      },
      success_url: `${appUrl}/generator?success=true`,
      cancel_url: `${appUrl}/generator`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);

    const message = err instanceof Error ? err.message : String(err);
    const isStripeError = message.includes("No such price") || message.includes("Invalid");

    return NextResponse.json(
      { error: isStripeError ? "Payment configuration error." : "Failed to create checkout session." },
      { status: 500 },
    );
  }
}
