import OpenAI from "openai";

let _client: OpenAI | null = null;

function getClient() {
  if (!_client) {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  }
  return _client;
}

const ASPECT_TO_SIZE: Record<string, "1024x1024" | "1024x1536" | "1536x1024"> = {
  "1:1": "1024x1024",
  "3:4": "1024x1536",
  "4:3": "1536x1024",
};

export type GptImageQuality = "low" | "medium" | "high";
export type GptImageBackground = "transparent" | "opaque" | "auto";

export async function generateWithGptImage1(
  prompt: string,
  aspectRatio: string = "1:1",
  quality: GptImageQuality = "medium",
  background: GptImageBackground = "auto",
): Promise<Buffer> {
  try {
    const size = ASPECT_TO_SIZE[aspectRatio] || "1024x1024";
    const response = await getClient().images.generate({
      model: "gpt-image-1",
      prompt,
      size,
      quality,
      background,
      n: 1,
    } as Parameters<typeof getClient().images.generate>[0]);

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) throw new Error("No image returned from OpenAI");

    return Buffer.from(b64, "base64");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);

    if (message.includes("429") || message.includes("rate_limit")) {
      throw new Error("RATE_LIMITED: Too many requests. Please wait a moment and try again.");
    }

    if (message.includes("billing") || message.includes("insufficient_quota")) {
      throw new Error("BILLING_REQUIRED: OpenAI API requires an active billing plan.");
    }

    throw err;
  }
}
