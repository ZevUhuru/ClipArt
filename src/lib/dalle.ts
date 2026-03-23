import OpenAI from "openai";

let _client: OpenAI | null = null;

function getClient() {
  if (!_client) {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
  }
  return _client;
}

export async function generateWithDallE(prompt: string): Promise<Buffer> {
  try {
    const response = await getClient().images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
      n: 1,
    });

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
