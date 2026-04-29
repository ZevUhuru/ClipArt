import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function readBody(request: NextRequest) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const body = await readBody(request);
  const sessionId = typeof body.session_id === "string" ? body.session_id : null;

  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  const admin = createSupabaseAdmin();
  const { data: pack } = await admin
    .from("packs")
    .select("id, zip_url, zip_status, visibility, is_published, is_free, user_id, price_cents, downloads")
    .eq("id", id)
    .single();

  if (!pack) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = Boolean(user && pack.user_id === user.id);

  if (pack.visibility === "private" && !isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!pack.is_published || pack.zip_status !== "ready" || !pack.zip_url) {
    return NextResponse.json({ error: "Pack is not available for download" }, { status: 400 });
  }

  if (pack.is_free && !user) {
    return NextResponse.json(
      { error: "Sign up for free to download packs" },
      { status: 401 },
    );
  }

  let purchaseId: string | null = null;
  let purchaseDownloadCount = 0;

  if (!pack.is_free && !isOwner) {
    let hasPurchase = false;

    if (user) {
      const { data: purchase } = await admin
        .from("pack_purchases")
        .select("id, download_count")
        .eq("pack_id", pack.id)
        .eq("user_id", user.id)
        .eq("status", "paid")
        .maybeSingle();

      if (purchase?.id) {
        hasPurchase = true;
        purchaseId = purchase.id;
        purchaseDownloadCount = purchase.download_count || 0;
      }
    }

    if (!hasPurchase && sessionId) {
      const { data: purchase } = await admin
        .from("pack_purchases")
        .select("id, download_count")
        .eq("pack_id", pack.id)
        .eq("stripe_session_id", sessionId)
        .eq("status", "paid")
        .maybeSingle();

      if (purchase?.id) {
        hasPurchase = true;
        purchaseId = purchase.id;
        purchaseDownloadCount = purchase.download_count || 0;
      } else if (process.env.STRIPE_SECRET_KEY) {
        const session = await getStripe().checkout.sessions.retrieve(sessionId);
        if (
          session.payment_status === "paid" &&
          session.metadata?.type === "pack_purchase" &&
          session.metadata?.packId === pack.id
        ) {
          const paymentIntent =
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id || null;
          const { data: fulfilled } = await admin
            .from("pack_purchases")
            .upsert(
              {
                pack_id: pack.id,
                user_id: user?.id || session.metadata?.userId || null,
                buyer_email: session.customer_details?.email || session.customer_email || null,
                stripe_session_id: session.id,
                stripe_payment_intent_id: paymentIntent,
                amount_cents: session.amount_total || 0,
                currency: session.currency || "usd",
                status: "paid",
              },
              { onConflict: "stripe_session_id" },
            )
            .select("id, download_count")
            .single();

          hasPurchase = true;
          purchaseId = fulfilled?.id || null;
          purchaseDownloadCount = fulfilled?.download_count || 0;
        }
      }
    }

    if (!hasPurchase) {
      return NextResponse.json({ error: "Purchase required" }, { status: 402 });
    }
  }

  if (purchaseId) {
    admin
      .from("pack_purchases")
      .update({ download_count: purchaseDownloadCount + 1 })
      .eq("id", purchaseId)
      .then(() => {})
      .catch(() => {});
  }

  admin
    .from("packs")
    .update({ downloads: (pack.downloads || 0) + 1 })
    .eq("id", id)
    .then(() => {})
    .catch(() => {});

  return NextResponse.json({ download_url: pack.zip_url });
}
