import { fal } from "@fal-ai/client";

// Background removal via fal.ai BiRefNet v2.
//
// Model: fal-ai/birefnet/v2
// Docs:  https://fal.ai/models/fal-ai/birefnet/v2/api
//
// Uses the "General Use (Light)" variant. AI-generated clipart on a clean
// white background is the easiest possible segmentation input — the subject
// is already isolated and edges are well-defined. Light is 90%+ as accurate
// as Heavy for this input type and runs 3-4x faster (lower GPU-seconds =
// lower cost). If production output shows edge artifacts on specific styles
// (most likely "realistic" or character-heavy prompts), upgrade those to
// "General Use (Heavy)" via a per-style lookup in this file.
//
// Input:  PNG buffer (from image model — white bg, 1024x1024)
// Output: transparent PNG buffer (alpha channel, ready for sharp → WebP)
//
// Passed as a base64 data URI; fal decodes it server-side. No intermediate
// upload step needed for 1024x1024 images (~500KB-2MB).

const MODEL_ID = "fal-ai/birefnet/v2";

interface BiRefNetOutput {
  image: {
    url: string;
    width: number;
    height: number;
    content_type: string;
  };
}

export async function removeBackground(pngBuffer: Buffer): Promise<Buffer> {
  const base64 = pngBuffer.toString("base64");
  const dataUri = `data:image/png;base64,${base64}`;

  const result = await fal.subscribe(MODEL_ID, {
    input: {
      image_url: dataUri,
      model: "General Use (Light)",
      operating_resolution: "1024x1024",
      output_format: "png",
      refine_foreground: true,
    },
  });

  const data = result.data as BiRefNetOutput;
  if (!data?.image?.url) {
    throw new Error("bgRemoval: no image URL returned from fal.ai BiRefNet");
  }

  const res = await fetch(data.image.url);
  if (!res.ok) {
    throw new Error(`bgRemoval: failed to fetch result image (${res.status})`);
  }

  return Buffer.from(await res.arrayBuffer());
}
