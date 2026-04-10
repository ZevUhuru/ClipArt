import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const ALLOWED_HOSTS = new Set(["images.clip.art"]);

const VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".mov"]);

// Letter page dimensions in PDF points (72pt = 1 inch)
const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 40;

async function buildColoringPdf(pngBuffer: Buffer, title: string): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  // Ensure we have a valid PNG
  const normalizedPng = await sharp(pngBuffer).png().toBuffer();
  const pngImage = await pdfDoc.embedPng(normalizedPng);

  const { width: imgW, height: imgH } = pngImage;
  const maxW = PAGE_WIDTH - MARGIN * 2;
  const maxH = PAGE_HEIGHT - MARGIN * 2;
  const scale = Math.min(maxW / imgW, maxH / imgH);
  const drawW = imgW * scale;
  const drawH = imgH * scale;

  // Center image on page
  const x = (PAGE_WIDTH - drawW) / 2;
  const y = (PAGE_HEIGHT - drawH) / 2;

  page.drawImage(pngImage, { x, y, width: drawW, height: drawH });

  // "clip.art" branding — bottom-right, small, light gray
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const brand = "clip.art";
  const fontSize = 9;
  const textW = font.widthOfTextAtSize(brand, fontSize);
  page.drawText(brand, {
    x: PAGE_WIDTH - MARGIN - textW,
    y: MARGIN - 22,
    size: fontSize,
    font,
    color: rgb(0.55, 0.55, 0.55),
  });

  // Set PDF metadata
  pdfDoc.setTitle(title);
  pdfDoc.setCreator("clip.art");
  pdfDoc.setProducer("clip.art");

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  const asPdf = request.nextUrl.searchParams.get("pdf") === "1";
  const titleParam = request.nextUrl.searchParams.get("title") || "Coloring Page";

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
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const segments = parsed.pathname.split("/");
  const rawFilename = segments[segments.length - 1] || "clip-art";
  const basename = rawFilename.replace(/\.[^.]+$/, "");
  const ext = rawFilename.includes(".") ? rawFilename.slice(rawFilename.lastIndexOf(".")) : "";

  if (VIDEO_EXTENSIONS.has(ext.toLowerCase())) {
    const contentType = upstream.headers.get("content-type") || "video/mp4";
    const body = upstream.body;
    return new NextResponse(body, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${basename}${ext}"`,
        "Cache-Control": "private, no-cache",
      },
    });
  }

  const rawBuffer = Buffer.from(await upstream.arrayBuffer());
  const contentType = upstream.headers.get("content-type") || "";

  // PDF path: coloring page download
  if (asPdf) {
    const pngBuffer = contentType === "image/png" || url.endsWith(".png")
      ? rawBuffer
      : await sharp(rawBuffer).png().toBuffer();

    const pdfBuffer = await buildColoringPdf(pngBuffer, titleParam);
    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${basename}.pdf"`,
        "Cache-Control": "private, no-cache",
      },
    });
  }

  // Standard PNG path
  const isPng = contentType === "image/png" || url.endsWith(".png");
  const outputBuffer = isPng ? rawBuffer : await sharp(rawBuffer).png().toBuffer();

  return new NextResponse(new Uint8Array(outputBuffer), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${basename}.png"`,
      "Cache-Control": "private, no-cache",
    },
  });
}
