import fs from "fs/promises";
import path from "path";
import sharp from "sharp";

// Cache the rasterized logo across requests in the same process
let cachedLogoPng: Buffer | null = null;

// Logo dimensions at target PDF render size (in points)
// SVG viewBox ratio: 3171.4 / 1035.3 ≈ 3.063
export const LOGO_PDF_H = 16; // height in PDF points
export const LOGO_PDF_W = Math.round(LOGO_PDF_H * (3171.4 / 1035.3)); // ≈ 49pt

export async function getLogoPng(): Promise<Buffer | null> {
  if (cachedLogoPng) return cachedLogoPng;
  try {
    const svgPath = path.join(process.cwd(), "public", "noBgColor.svg");
    const svgBuffer = await fs.readFile(svgPath);
    // Rasterize at 4× target height for crispness
    cachedLogoPng = await sharp(svgBuffer)
      .resize({ height: LOGO_PDF_H * 4, fit: "inside" })
      .png()
      .toBuffer();
    return cachedLogoPng;
  } catch {
    return null;
  }
}
