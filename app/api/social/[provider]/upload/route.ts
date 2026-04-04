import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer, createSupabaseAdmin } from "@/lib/supabase/server";
import { getProvider } from "@/lib/social/registry";
import type { UploadMetadata } from "@/lib/social/types";

interface RouteContext {
  params: { provider: string };
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const provider = getProvider(params.provider);
  if (!provider) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 404 });
  }

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { animationId, title, description, tags, privacy } = body;

  if (!animationId || !title) {
    return NextResponse.json(
      { error: "animationId and title are required" },
      { status: 400 },
    );
  }

  const admin = createSupabaseAdmin();

  const { data: connection } = await admin
    .from("social_connections")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", user.id)
    .eq("provider", params.provider)
    .single();

  if (!connection) {
    return NextResponse.json(
      { error: "Not connected to this platform" },
      { status: 400 },
    );
  }

  const { data: animation } = await admin
    .from("animations")
    .select("id, video_url, prompt")
    .eq("id", animationId)
    .eq("user_id", user.id)
    .eq("status", "completed")
    .single();

  if (!animation?.video_url) {
    return NextResponse.json(
      { error: "Animation not found or not completed" },
      { status: 404 },
    );
  }

  let accessToken = connection.access_token;
  const isExpired =
    connection.expires_at && new Date(connection.expires_at) < new Date();

  if (isExpired && connection.refresh_token) {
    try {
      const refreshed = await provider.refreshAccessToken(
        connection.refresh_token,
      );
      accessToken = refreshed.accessToken;
      await admin
        .from("social_connections")
        .update({
          access_token: refreshed.accessToken,
          refresh_token: refreshed.refreshToken || connection.refresh_token,
          expires_at: refreshed.expiresAt?.toISOString() || null,
        })
        .eq("user_id", user.id)
        .eq("provider", params.provider);
    } catch (err) {
      console.error("Token refresh failed:", err);
      return NextResponse.json(
        { error: "Session expired. Please reconnect your account." },
        { status: 401 },
      );
    }
  }

  const { data: uploadRecord } = await admin
    .from("social_uploads")
    .insert({
      user_id: user.id,
      animation_id: animationId,
      provider: params.provider,
      title,
      status: "uploading",
    })
    .select("id")
    .single();

  const metadata: UploadMetadata = {
    title: title || "Clip Art Animation",
    description: description || animation.prompt || "",
    tags: tags || [],
    privacy: privacy || provider.metadataConstraints.defaultPrivacy,
  };

  try {
    const result = await provider.upload(
      accessToken,
      animation.video_url,
      metadata,
    );

    await admin
      .from("social_uploads")
      .update({
        status: "published",
        platform_video_id: result.platformVideoId,
        platform_url: result.platformUrl,
      })
      .eq("id", uploadRecord!.id);

    return NextResponse.json({
      success: true,
      platformVideoId: result.platformVideoId,
      platformUrl: result.platformUrl,
    });
  } catch (err) {
    console.error(`Upload to ${params.provider} failed:`, err);

    if (uploadRecord) {
      await admin
        .from("social_uploads")
        .update({
          status: "failed",
          error_message:
            err instanceof Error ? err.message : "Upload failed",
        })
        .eq("id", uploadRecord.id);
    }

    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 },
    );
  }
}
