// Background removal model catalog for fal.ai.
//
// Shared between the server-side bgRemoval.ts pipeline and the admin UI
// (app/admin/models/page.tsx). No Node.js-specific imports — safe for both.
//
// BiRefNet v2 docs:       https://fal.ai/models/fal-ai/birefnet/v2/api
// BRIA RMBG 2.0 docs:     https://fal.ai/models/fal-ai/bria/background/remove/api
//
// Pricing notes:
//   - BiRefNet: GPU-time billing. fal.ai H100 at ~$0.0005/s. Estimates based on
//     typical 1024×1024 inference durations — actual cost varies with image
//     complexity. Numbers here are conservative mid-point estimates.
//   - BRIA: flat $0.018/generation regardless of image content or resolution.

export interface BgRemovalModel {
  /** Stable ID stored in site_settings. Do not change once in use. */
  id: string;
  /** fal.ai endpoint to call. */
  endpoint: string;
  /** BiRefNet variant name passed as `model` param. Null for non-BiRefNet endpoints. */
  variant: string | null;
  label: string;
  description: string;
  /** Conservative per-image cost estimate in USD for display purposes. */
  estimatedCost: number;
  /** Human-readable pricing note shown in admin. */
  pricingNote: string;
  /** Whether this model has a fixed flat price (vs GPU-time variable). */
  flatRate: boolean;
}

export const BG_REMOVAL_CATALOG: BgRemovalModel[] = [
  {
    id: "birefnet-light",
    endpoint: "fal-ai/birefnet/v2",
    variant: "General Use (Light)",
    label: "BiRefNet Light",
    description: "Fast general-purpose removal. Recommended for flat and cartoon clipart on white backgrounds.",
    estimatedCost: 0.0003,
    pricingNote: "~$0.0003/img · GPU-time · ~0.5s",
    flatRate: false,
  },
  {
    id: "birefnet-light-2k",
    endpoint: "fal-ai/birefnet/v2",
    variant: "General Use (Light 2K)",
    label: "BiRefNet Light 2K",
    description: "Light model trained on 2K resolution images. Better edge handling on high-detail subjects.",
    estimatedCost: 0.0004,
    pricingNote: "~$0.0004/img · GPU-time · ~0.7s",
    flatRate: false,
  },
  {
    id: "birefnet-heavy",
    endpoint: "fal-ai/birefnet/v2",
    variant: "General Use (Heavy)",
    label: "BiRefNet Heavy",
    description: "Highest accuracy. Use for complex, realistic, or detail-rich subjects where edge quality matters most.",
    estimatedCost: 0.0009,
    pricingNote: "~$0.0009/img · GPU-time · ~1.5-2s",
    flatRate: false,
  },
  {
    id: "birefnet-portrait",
    endpoint: "fal-ai/birefnet/v2",
    variant: "Portrait",
    label: "BiRefNet Portrait",
    description: "Optimized for portrait and character images. Good for character-style clipart.",
    estimatedCost: 0.0005,
    pricingNote: "~$0.0005/img · GPU-time · ~1s",
    flatRate: false,
  },
  {
    id: "birefnet-matting",
    endpoint: "fal-ai/birefnet/v2",
    variant: "Matting",
    label: "BiRefNet Matting",
    description: "Specialized for alpha matting tasks. Best for soft or gradient transparency at subject edges.",
    estimatedCost: 0.0008,
    pricingNote: "~$0.0008/img · GPU-time · ~1.5s",
    flatRate: false,
  },
  {
    id: "birefnet-dynamic",
    endpoint: "fal-ai/birefnet/v2",
    variant: "General Use (Dynamic)",
    label: "BiRefNet Dynamic",
    description: "Supports variable resolutions from 256×256 to 2304×2304. Use operating_resolution 2304×2304 for ultra-high-res.",
    estimatedCost: 0.0006,
    pricingNote: "~$0.0006/img · GPU-time · variable",
    flatRate: false,
  },
  {
    id: "bria",
    endpoint: "fal-ai/bria/background/remove",
    variant: null,
    label: "BRIA RMBG 2.0",
    description: "Flat-rate model trained exclusively on licensed commercial data. Consistent pricing, no GPU-time variance.",
    estimatedCost: 0.018,
    pricingNote: "$0.018/img · flat rate",
    flatRate: true,
  },
];

export const BG_REMOVAL_CATALOG_BY_ID = Object.fromEntries(
  BG_REMOVAL_CATALOG.map((m) => [m.id, m]),
) as Record<string, BgRemovalModel>;

export const DEFAULT_BG_REMOVAL_MODEL_ID = "birefnet-light";

export const VALID_BG_REMOVAL_MODEL_IDS: ReadonlySet<string> = new Set(
  BG_REMOVAL_CATALOG.map((m) => m.id),
);
