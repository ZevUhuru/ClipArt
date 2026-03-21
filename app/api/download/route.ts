import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

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

  const rawBuffer = Buffer.from(await upstream.arrayBuffer());
  const contentType = upstream.headers.get("content-type") || "";

  const isPng = contentType === "image/png" || url.endsWith(".png");
  let outputBuffer: Buffer;
  let outputFilename: string;

  const segments = parsed.pathname.split("/");
  const basename = (segments[segments.length - 1] || "clip-art").replace(/\.[^.]+$/, "");

  if (isPng || contentType === "image/png") {
    outputBuffer = rawBuffer;
    outputFilename = `${basename}.png`;
  } else {
    outputBuffer = await sharp(rawBuffer).png().toBuffer();
    outputFilename = `${basename}.png`;
  }

  return new NextResponse(outputBuffer, {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${outputFilename}"`,
      "Cache-Control": "private, no-cache",
    },
  });
}
