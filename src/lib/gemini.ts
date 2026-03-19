import { GoogleGenAI } from "@google/genai";

let _ai: InstanceType<typeof GoogleGenAI> | null = null;

function getAI() {
  if (!_ai) {
    _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  }
  return _ai;
}

export async function generateClipArt(prompt: string): Promise<Buffer> {
  const response = await getAI().models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: prompt,
    config: {
      responseModalities: ["IMAGE"],
      imageConfig: { aspectRatio: "1:1" },
    },
  });

  const part = response.candidates?.[0]?.content?.parts?.[0];

  if (!part || !("inlineData" in part) || !part.inlineData?.data) {
    throw new Error("No image returned from Gemini");
  }

  return Buffer.from(part.inlineData.data, "base64");
}
