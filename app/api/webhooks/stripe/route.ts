import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.userId;
    const purchaseType = session.metadata?.type;

    const admin = createSupabaseAdmin();

    if (purchaseType === "pack_purchase") {
      const packId = session.metadata?.packId;
      if (!packId) {
        console.error("Missing metadata in pack purchase session");
        return NextResponse.json({ error: "Invalid metadata" }, { status: 400 });
      }

      const paymentIntent =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id || null;

      await admin.from("pack_purchases").upsert(
        {
          pack_id: packId,
          user_id: userId || null,
          buyer_email: session.customer_details?.email || session.customer_email || null,
          stripe_session_id: session.id,
          stripe_payment_intent_id: paymentIntent,
          amount_cents: session.amount_total || 0,
          currency: session.currency || "usd",
          status: "paid",
        },
        { onConflict: "stripe_session_id" },
      );
    } else {
      const credits = parseInt(session.metadata?.credits || "0", 10);

      if (!userId || !credits) {
        console.error("Missing metadata in checkout session");
        return NextResponse.json({ error: "Invalid metadata" }, { status: 400 });
      }

      const { data: profile } = await admin
        .from("profiles")
        .select("credits")
        .eq("id", userId)
        .single();

      if (profile) {
        await admin
          .from("profiles")
          .update({ credits: profile.credits + credits })
          .eq("id", userId);
      }

      await admin.from("purchases").insert({
        user_id: userId,
        stripe_session_id: session.id,
        credits_added: credits,
        amount_cents: session.amount_total || 0,
      });
    }
  }

  return NextResponse.json({ received: true });
}
