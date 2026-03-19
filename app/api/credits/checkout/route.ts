import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getStripe, CREDIT_PACKS } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const { packId } = await request.json();
    const pack = CREDIT_PACKS[packId];

    if (!pack) {
      return NextResponse.json({ error: "Invalid pack" }, { status: 400 });
    }

    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ price: pack.priceId, quantity: 1 }],
      metadata: {
        userId: user.id,
        credits: String(pack.credits),
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/generator?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/generator`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
