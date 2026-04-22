import { GoogleGenAI } from "@google/genai";

let _ai: InstanceType<typeof GoogleGenAI> | null = null;

function getAI() {
  if (!_ai) {
    _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  }
  return _ai;
}

// Default: Gemini 3.1 Flash Image Preview ("Nano Banana 2", released Feb 2026).
// Same env var as generation so a single override updates both paths.
const MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image-preview";

export async function editImage(
  imageBuffer: Buffer,
  mimeType: string,
  instruction: string,
): Promise<Buffer> {
  try {
    const base64 = imageBuffer.toString("base64");

    const response = await getAI().models.generateContent({
      model: MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { text: instruction },
            { inlineData: { mimeType, data: base64 } },
          ],
        },
      ],
      config: {
        responseModalities: ["IMAGE"],
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];

    if (!part || !("inlineData" in part) || !part.inlineData?.data) {
      throw new Error("No image returned from Gemini edit");
    }

    return Buffer.from(part.inlineData.data, "base64");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    if (message.includes("429") || message.includes("RESOURCE_EXHAUSTED")) {
      if (message.includes("free_tier") || message.includes("limit: 0")) {
        throw new Error(
          "BILLING_REQUIRED: Gemini image editing requires a billing-enabled API key.",
        );
      }
      throw new Error("RATE_LIMITED: Too many requests. Please wait a moment and try again.");
    }

    throw err;
  }
}
