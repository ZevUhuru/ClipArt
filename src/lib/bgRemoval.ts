import { fal } from "@fal-ai/client";
import {
  BG_REMOVAL_CATALOG_BY_ID,
  DEFAULT_BG_REMOVAL_MODEL_ID,
} from "./bgRemovalCatalog";

// Background removal via fal.ai.
//
// Supports all models in bgRemovalCatalog.ts — BiRefNet v2 variants and
// BRIA RMBG 2.0. The active model is controlled from /admin/models via the
// bg_removal_config site_settings key.
//
// Default: BiRefNet Light — fast, good quality on AI-generated clipart with
// white backgrounds. AI-generated cartoon/flat clipart is the easiest possible
// segmentation input; Light handles it at 90%+ of Heavy's accuracy.
//
// Input:  PNG buffer (from image model — white bg, 1024x1024)
// Output: transparent PNG buffer (alpha channel, ready for sharp → WebP)
//
// Passed as a base64 data URI; fal decodes it server-side. No intermediate
// upload step needed for 1024x1024 images (~500KB-2MB).

interface FalImageOutput {
  image: {
    url: string;
    width: number;
    height: number;
    content_type: string;
  };
}

export async function removeBackground(
  pngBuffer: Buffer,
  modelId: string = DEFAULT_BG_REMOVAL_MODEL_ID,
): Promise<Buffer> {
  const model = BG_REMOVAL_CATALOG_BY_ID[modelId] ?? BG_REMOVAL_CATALOG_BY_ID[DEFAULT_BG_REMOVAL_MODEL_ID];

  const base64 = pngBuffer.toString("base64");
  const dataUri = `data:image/png;base64,${base64}`;

  let input: Record<string, unknown>;

  if (model.endpoint === "fal-ai/birefnet/v2") {
    input = {
      image_url: dataUri,
      model: model.variant,
      operating_resolution: "1024x1024",
      output_format: "png",
      refine_foreground: true,
    };
  } else {
    // BRIA RMBG 2.0 — simple single-param API
    input = { image_url: dataUri };
  }

  const result = await fal.subscribe(model.endpoint, { input });

  const data = result.data as FalImageOutput;
  if (!data?.image?.url) {
    throw new Error(`bgRemoval: no image URL returned from fal.ai (model: ${model.id})`);
  }

  const res = await fetch(data.image.url);
  if (!res.ok) {
    throw new Error(`bgRemoval: failed to fetch result image (${res.status})`);
  }

  return Buffer.from(await res.arrayBuffer());
}
