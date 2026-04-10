import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const ALLOWED_HOSTS = new Set(["images.clip.art"]);

const VIDEO_EXTENSIONS = new Set([".mp4", ".webm", ".mov"]);

// Letter page in PDF points (72pt = 1 inch)
const PW = 612;
const PH = 792;
const MARGIN = 36;

const BRAND_PINK = rgb(0.96, 0.45, 0.71);
const GRAY_MID = rgb(0.45, 0.45, 0.45);
const GRAY_LIGHT = rgb(0.75, 0.75, 0.75);
const GRAY_RULE = rgb(0.88, 0.88, 0.88);

async function buildColoringPdf(pngBuffer: Buffer, title: string): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([PW, PH]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const normalizedPng = await sharp(pngBuffer).png().toBuffer();
  const pngImage = await pdfDoc.embedPng(normalizedPng);

  const HEADER_H = 30;
  const FOOTER_H = 50;

  // ── Header bar ──
  page.drawRectangle({ x: 0, y: PH - HEADER_H, width: PW, height: HEADER_H, color: rgb(0.98, 0.98, 0.98) });
  page.drawLine({
    start: { x: 0, y: PH - HEADER_H },
    end: { x: PW, y: PH - HEADER_H },
    thickness: 0.5,
    color: GRAY_RULE,
  });
  page.drawText("clip.art", {
    x: MARGIN,
    y: PH - HEADER_H + 9,
    size: 9,
    font: fontBold,
    color: BRAND_PINK,
  });
  const freeLabel = "Free Coloring Page";
  const freeLabelW = font.widthOfTextAtSize(freeLabel, 9);
  page.drawText(freeLabel, {
    x: PW - MARGIN - freeLabelW,
    y: PH - HEADER_H + 9,
    size: 9,
    font,
    color: GRAY_MID,
  });

  // ── Footer ──
  page.drawLine({
    start: { x: MARGIN, y: FOOTER_H },
    end: { x: PW - MARGIN, y: FOOTER_H },
    thickness: 0.5,
    color: GRAY_RULE,
  });
  const safeTitle = title.length > 52 ? title.slice(0, 51) + "…" : title;
  page.drawText(safeTitle, {
    x: MARGIN,
    y: FOOTER_H - 13,
    size: 7.5,
    font,
    color: GRAY_MID,
  });
  page.drawText("Name:", {
    x: MARGIN,
    y: 16,
    size: 8,
    font,
    color: GRAY_MID,
  });
  const nameStart = MARGIN + font.widthOfTextAtSize("Name:", 8) + 6;
  const brandLabel = "clip.art";
  const brandLabelW = font.widthOfTextAtSize(brandLabel, 8);
  page.drawLine({
    start: { x: nameStart, y: 18 },
    end: { x: PW - MARGIN - brandLabelW - 8, y: 18 },
    thickness: 0.5,
    color: GRAY_LIGHT,
  });
  page.drawText(brandLabel, {
    x: PW - MARGIN - brandLabelW,
    y: 16,
    size: 8,
    font,
    color: GRAY_LIGHT,
  });

  // ── Image centered in available area ──
  const imgTop = PH - HEADER_H - 6;
  const imgBottom = FOOTER_H + 6;
  const areaW = PW - MARGIN * 2;
  const areaH = imgTop - imgBottom;
  const { width: iW, height: iH } = pngImage;
  const scale = Math.min(areaW / iW, areaH / iH);
  const dW = iW * scale;
  const dH = iH * scale;
  page.drawImage(pngImage, {
    x: (PW - dW) / 2,
    y: imgBottom + (areaH - dH) / 2,
    width: dW,
    height: dH,
  });

  pdfDoc.setTitle(title);
  pdfDoc.setCreator("clip.art");
  pdfDoc.setProducer("clip.art");

  return Buffer.from(await pdfDoc.save());
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
