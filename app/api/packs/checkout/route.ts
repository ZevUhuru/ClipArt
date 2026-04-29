import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function resolvePackPrice(pack: {
  price_cents: number | null;
  launch_price_cents: number | null;
  launch_ends_at: string | null;
}) {
  if (pack.launch_price_cents && pack.launch_price_cents > 0) {
    if (!pack.launch_ends_at || new Date(pack.launch_ends_at).getTime() > Date.now()) {
      return pack.launch_price_cents;
    }
  }

  return pack.price_cents || 0;
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Payments are not configured yet." },
        { status: 503 },
      );
    }

    const { pack_id, buyer_email } = await request.json();
    if (!pack_id) {
      return NextResponse.json({ error: "pack_id is required" }, { status: 400 });
    }

    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user && buyer_email !== undefined && !isValidEmail(buyer_email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const admin = createSupabaseAdmin();
    const { data: pack } = await admin
      .from("packs")
      .select("id, title, slug, price_cents, launch_price_cents, launch_ends_at, stripe_price_id, is_free, is_published, visibility, categories!category_id(slug)")
      .eq("id", pack_id)
      .single();

    if (!pack || !pack.is_published || pack.visibility !== "public") {
      return NextResponse.json({ error: "Pack not found" }, { status: 404 });
    }

    if (pack.is_free) {
      return NextResponse.json({ error: "This pack is free" }, { status: 400 });
    }

    const effectivePriceCents = resolvePackPrice(pack);
    if (effectivePriceCents <= 0) {
      return NextResponse.json({ error: "Pack has no price set" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://clip.art";
    const catSlug = pack.categories?.slug || "all";
    const packUrl = `${appUrl}/design-bundles/${catSlug}/${pack.slug}`;

    const sessionConfig: Record<string, unknown> = {
      mode: "payment",
      payment_method_types: ["card"],
      metadata: {
        ...(user ? { userId: user.id } : {}),
        packId: pack.id,
        type: "pack_purchase",
      },
      success_url: `${packUrl}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: packUrl,
    };

    const checkoutEmail = user?.email || buyer_email;
    if (checkoutEmail) {
      sessionConfig.customer_email = checkoutEmail;
    }

    if (pack.stripe_price_id) {
      sessionConfig.line_items = [{ price: pack.stripe_price_id, quantity: 1 }];
    } else {
      sessionConfig.line_items = [
        {
          price_data: {
            currency: "usd",
            product_data: { name: pack.title },
            unit_amount: effectivePriceCents,
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
