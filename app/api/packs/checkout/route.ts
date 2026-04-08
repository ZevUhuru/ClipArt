import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Payments are not configured yet." },
        { status: 503 },
      );
    }

    const { pack_id } = await request.json();
    if (!pack_id) {
      return NextResponse.json({ error: "pack_id is required" }, { status: 400 });
    }

    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const admin = createSupabaseAdmin();
    const { data: pack } = await admin
      .from("packs")
      .select("id, title, slug, price_cents, stripe_price_id, is_free, is_published, visibility, categories!category_id(slug)")
      .eq("id", pack_id)
      .single();

    if (!pack || !pack.is_published || pack.visibility !== "public") {
      return NextResponse.json({ error: "Pack not found" }, { status: 404 });
    }

    if (pack.is_free) {
      return NextResponse.json({ error: "This pack is free" }, { status: 400 });
    }

    if (!pack.price_cents || pack.price_cents <= 0) {
      return NextResponse.json({ error: "Pack has no price set" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://clip.art";
    const catSlug = pack.categories?.slug || "all";
    const packUrl = `${appUrl}/design-bundles/${catSlug}/${pack.slug}`;

    const sessionConfig: Record<string, unknown> = {
      mode: "payment",
      payment_method_types: ["card"],
      metadata: {
        userId: user.id,
        packId: pack.id,
        type: "pack_purchase",
      },
      success_url: `${packUrl}?purchased=true`,
      cancel_url: packUrl,
    };

    if (pack.stripe_price_id) {
      sessionConfig.line_items = [{ price: pack.stripe_price_id, quantity: 1 }];
    } else {
      sessionConfig.line_items = [
        {
          price_data: {
            currency: "usd",
            product_data: { name: pack.title },
            unit_amount: pack.price_cents,
          },
          quantity: 1,
        },
      ];
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create(
      sessionConfig as never,
    );

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const stripeErr = err as { message?: string };
    console.error("Pack checkout error:", stripeErr.message);
    return NextResponse.json(
      { error: stripeErr.message || "Failed to create checkout session." },
      { status: 500 },
    );
  }
}
