import sharp from "sharp";

/**
 * Extracts a thumbnail from an image buffer (the source clip art).
 * At launch we use the source image as poster frame rather than extracting
 * from the video. FFmpeg-based video frame extraction is planned for phase 2.
 */
export async function generateThumbnail(
  imageBuffer: Buffer,
  width: number = 480,
): Promise<Buffer> {
  return sharp(imageBuffer)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();
}
