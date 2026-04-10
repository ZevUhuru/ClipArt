import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createSupabaseAdmin } from "@/lib/supabase/server";

// Letter page in PDF points (72pt = 1 inch)
const PW = 612;
const PH = 792;
const MARGIN = 36;

const BRAND_PINK = rgb(0.96, 0.45, 0.71);
const GRAY_DARK = rgb(0.15, 0.15, 0.15);
const GRAY_MID = rgb(0.45, 0.45, 0.45);
const GRAY_LIGHT = rgb(0.75, 0.75, 0.75);
const GRAY_RULE = rgb(0.88, 0.88, 0.88);

async function fetchPng(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return await sharp(buf).png().toBuffer();
  } catch {
    return null;
  }
}

function titleCase(slug: string) {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ theme: string }> },
) {
  const { theme } = await params;
  const themeName = titleCase(theme);
  const catPattern = `%${theme.replace(/-/g, " ")}%`;

  // Fetch up to 10 coloring images for this theme
  const admin = createSupabaseAdmin();
  const { data: rows, error } = await admin
    .from("generations")
    .select("id, title, prompt, image_url, slug, aspect_ratio")
    .eq("content_type", "coloring")
    .eq("is_public", true)
    .or(`category.eq.${theme},prompt.ilike.${catPattern},title.ilike.${catPattern}`)
    .order("created_at", { ascending: false })
    .limit(10);

  if (error || !rows || rows.length === 0) {
    return NextResponse.json({ error: "No coloring pages found for this theme" }, { status: 404 });
  }

  const images = rows.slice(0, 10);
  const total = images.length;

  // Fetch all image buffers in parallel
  const buffers = await Promise.all(images.map((img: { image_url: string }) => fetchPng(img.image_url)));

  // ── Build PDF ──────────────────────────────────────────────────────────────
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Embed images for reuse across cover + content pages
  const embedded = await Promise.all(
    buffers.map(async (buf) => {
      if (!buf) return null;
      try {
        return await pdfDoc.embedPng(buf);
      } catch {
        return null;
      }
    }),
  );

  // ── COVER PAGE ─────────────────────────────────────────────────────────────
  const cover = pdfDoc.addPage([PW, PH]);

  // Pink header bar
  cover.drawRectangle({ x: 0, y: PH - 44, width: PW, height: 44, color: BRAND_PINK });
  const brandHeader = "clip.art";
  cover.drawText(brandHeader, {
    x: MARGIN,
    y: PH - 28,
    size: 13,
    font: fontBold,
    color: rgb(1, 1, 1),
  });
  const freeText = "Free Coloring Book";
  const freeTextW = font.widthOfTextAtSize(freeText, 10);
  cover.drawText(freeText, {
    x: PW - MARGIN - freeTextW,
    y: PH - 26,
    size: 10,
    font,
    color: rgb(0.95, 0.95, 0.95),
  });

  // Book title
  const bookTitle = `${themeName} Coloring Book`;
  const titleSize = bookTitle.length > 24 ? 22 : 26;
  const titleW = fontBold.widthOfTextAtSize(bookTitle, titleSize);
  cover.drawText(bookTitle, {
    x: (PW - titleW) / 2,
    y: PH - 96,
    size: titleSize,
    font: fontBold,
    color: GRAY_DARK,
  });

  // Subtitle
  const subtitle = `${total} Free Printable Pages · clip.art`;
  const subW = font.widthOfTextAtSize(subtitle, 11);
  cover.drawText(subtitle, {
    x: (PW - subW) / 2,
    y: PH - 120,
    size: 11,
    font,
    color: GRAY_MID,
  });

  // Divider
  cover.drawLine({
    start: { x: MARGIN + 40, y: PH - 136 },
    end: { x: PW - MARGIN - 40, y: PH - 136 },
    thickness: 0.75,
    color: GRAY_RULE,
  });

  // Thumbnail grid: 3 cols × 2 rows (up to 6 images)
  const COLS = 3;
  const THUMB_GAP = 10;
  const THUMB_W = (PW - MARGIN * 2 - THUMB_GAP * (COLS - 1)) / COLS; // ≈ 173
  const THUMB_H = THUMB_W * (4 / 3); // 3:4 portrait ≈ 231
  const GRID_TOP = PH - 156; // top of first row (y in PDF = bottom-left origin)
  const ROWS = 2;

  for (let i = 0; i < Math.min(COLS * ROWS, total); i++) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = MARGIN + col * (THUMB_W + THUMB_GAP);
    const y = GRID_TOP - row * (THUMB_H + THUMB_GAP) - THUMB_H;

    const img = embedded[i];
    if (img) {
      const { width: iW, height: iH } = img;
      const scale = Math.min(THUMB_W / iW, THUMB_H / iH);
      const dW = iW * scale;
      const dH = iH * scale;
      // Center within cell
      cover.drawImage(img, {
        x: x + (THUMB_W - dW) / 2,
        y: y + (THUMB_H - dH) / 2,
        width: dW,
        height: dH,
      });
    } else {
      cover.drawRectangle({ x, y, width: THUMB_W, height: THUMB_H, color: rgb(0.94, 0.94, 0.94) });
    }
  }

  // Cover footer
  const coverFooterY = 28;
  const coverFooterText = `Free to print and share · clip.art/coloring-pages/${theme}`;
  const coverFooterW = font.widthOfTextAtSize(coverFooterText, 8);
  cover.drawText(coverFooterText, {
    x: (PW - coverFooterW) / 2,
    y: coverFooterY,
    size: 8,
    font,
    color: GRAY_LIGHT,
  });

  // ── CONTENT PAGES ──────────────────────────────────────────────────────────
  const HEADER_H = 30;
  const FOOTER_H = 50;
  const IMG_TOP = PH - HEADER_H - 6;
  const IMG_BOTTOM = FOOTER_H + 6;
  const IMG_AREA_H = IMG_TOP - IMG_BOTTOM;
  const IMG_AREA_W = PW - MARGIN * 2;

  for (let i = 0; i < images.length; i++) {
    const row = images[i];
    const page = pdfDoc.addPage([PW, PH]);
    const pageTitle = truncate(row.title || row.prompt || `Coloring Page ${i + 1}`, 52);
    const pageLabel = `${i + 1} / ${total}`;

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
    const pageLabelW = font.widthOfTextAtSize(pageLabel, 9);
    page.drawText(pageLabel, {
      x: PW - MARGIN - pageLabelW,
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

    // Image title
    page.drawText(pageTitle, {
      x: MARGIN,
      y: FOOTER_H - 13,
      size: 7.5,
      font,
      color: GRAY_MID,
    });

    // Name line
    page.drawText("Name:", {
      x: MARGIN,
      y: 16,
      size: 8,
      font,
      color: GRAY_MID,
    });
    const nameLineStart = MARGIN + font.widthOfTextAtSize("Name:", 8) + 6;
    const brandLabel = "clip.art";
    const brandLabelW = font.widthOfTextAtSize(brandLabel, 8);
    const nameLineEnd = PW - MARGIN - brandLabelW - 8;
    page.drawLine({
      start: { x: nameLineStart, y: 18 },
      end: { x: nameLineEnd, y: 18 },
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

    // ── Image ──
    const img = embedded[i];
    if (img) {
      const { width: iW, height: iH } = img;
      const scale = Math.min(IMG_AREA_W / iW, IMG_AREA_H / iH);
      const dW = iW * scale;
      const dH = iH * scale;
      page.drawImage(img, {
        x: (PW - dW) / 2,
        y: IMG_BOTTOM + (IMG_AREA_H - dH) / 2,
        width: dW,
        height: dH,
      });
    }
  }

  pdfDoc.setTitle(`${themeName} Coloring Book`);
  pdfDoc.setAuthor("clip.art");
  pdfDoc.setCreator("clip.art");
  pdfDoc.setProducer("clip.art");
  pdfDoc.setKeywords([theme, "coloring book", "free printable", "coloring pages", "clip.art"]);

  const pdfBytes = await pdfDoc.save();

  return new NextResponse(new Uint8Array(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${theme}-coloring-book.pdf"`,
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
