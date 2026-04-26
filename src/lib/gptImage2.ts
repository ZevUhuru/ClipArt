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

// gpt-image-2 (ChatGPT Images 2.0, released 2026-04-21).
// Docs: https://platform.openai.com/docs/api-reference/images/create
// - No `input_fidelity` param (always high-fidelity on image inputs).
// - DOES support transparent backgrounds via `background: "transparent"`.
//   Requires output_format "png" or "webp" (not "jpeg").
// - Token accounting differs from prior gpt-image-1.x models; per-image cost
//   is derived from (size, quality) via OpenAI's calculator rather than a
//   fixed image-token count.
export async function generateWithGptImage2(
  prompt: string,
  aspectRatio: string = "1:1",
  quality: GptImageQuality = "medium",
  background: GptImageBackground = "auto",
): Promise<Buffer> {
  try {
    const size = ASPECT_TO_SIZE[aspectRatio] || "1024x1024";
    const response = await getClient().images.generate({
      // Cast because some @openai/openai SDK versions haven't landed the
      // gpt-image-2 literal in their model union yet; the API accepts the
      // string regardless.
      model: "gpt-image-2" as unknown as "gpt-image-1",
      prompt,
      size,
      quality,
      background,
      n: 1,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

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

    if (message.includes("model_not_found") || message.includes("does not exist")) {
      throw new Error(
        "MODEL_UNAVAILABLE: gpt-image-2 is not yet enabled on this OpenAI account. " +
          "Check your org's model access.",
      );
    }

    throw err;
  }
}
