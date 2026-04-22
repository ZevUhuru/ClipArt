import { GoogleGenAI } from "@google/genai";

// Gemini 3 Pro Image ("Nano Banana Pro", released Nov 2025).
// The premium tier in Google's image line — stronger reasoning, better at
// text-in-image, up to 14 reference images per prompt, 4K output. ~3.4× the
// price of Flash (NB2) at 1K, so reserve for hero jobs (book covers, premium
// illustrations) rather than batch/volume work.

let _ai: InstanceType<typeof GoogleGenAI> | null = null;

function getAI() {
  if (!_ai) {
    _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  }
  return _ai;
}

const MODEL = process.env.GEMINI_PRO_IMAGE_MODEL || "gemini-3-pro-image-preview";

export async function generateWithGeminiPro(
  prompt: string,
  aspectRatio: string = "1:1",
): Promise<Buffer> {
  try {
    const response = await getAI().models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseModalities: ["IMAGE"],
        imageConfig: { aspectRatio },
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];

    if (!part || !("inlineData" in part) || !part.inlineData?.data) {
      throw new Error("No image returned from Gemini Pro");
    }

    return Buffer.from(part.inlineData.data, "base64");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    if (message.includes("429") || message.includes("RESOURCE_EXHAUSTED")) {
      if (message.includes("free_tier") || message.includes("limit: 0")) {
        throw new Error(
          "BILLING_REQUIRED: Gemini 3 Pro Image requires a billing-enabled API key. " +
            "Enable billing at https://aistudio.google.com/apikey",
        );
      }
      throw new Error("RATE_LIMITED: Too many requests. Please wait a moment and try again.");
    }

    if (message.includes("model_not_found") || message.includes("NOT_FOUND")) {
      throw new Error(
        "MODEL_UNAVAILABLE: gemini-3-pro-image-preview is not enabled on this API key. " +
          "Check region/preview access in Google AI Studio.",
      );
    }

    throw err;
  }
}
