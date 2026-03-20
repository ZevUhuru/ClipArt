import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTS = new Set(["images.clip.art"]);

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
  }

  const upstream = await fetch(url);

  if (!upstream.ok) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  const contentType = upstream.headers.get("content-type") || "image/png";
  const segments = parsed.pathname.split("/");
  const filename = segments[segments.length - 1] || "clip-art.png";

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-cache",
    },
  });
}
