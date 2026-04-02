# Smart Prompt Suggestions

## Overview

AI-powered prompt suggestion system in the Animation Studio that analyzes an imported image and generates 5 tailored animation prompts, plus a curated template library with 25 categorized presets.

## Problem

Users (especially non-technical audiences like teachers and homeschooling parents) waste animation credits on poorly written prompts. The typical workaround was copying the image to an external AI assistant, asking it to generate prompts based on the Kling prompting guide, then pasting the best one back. This workflow is slow, breaks context, and requires knowledge of how to prompt an LLM about prompting another AI.

## Solution

Bring the entire workflow into the Animation Studio:

1. **AI Suggestions** — One-click "Suggest prompts for this image" button that sends the image to Gemini 2.0 Flash with vision, using a system prompt distilled from the [Kling 3.0 Prompting Guide](https://blog.fal.ai/kling-3-0-prompting-guide/). Returns 5 image-specific animation prompts as selectable cards.

2. **Template Library** — 25 curated animation prompt templates across 4 categories (Character, Camera, Mood, Nature) as a collapsible browse section with category filtering.

## Architecture

```
User imports image → Clicks "Suggest prompts" →
  POST /api/animate/suggestions
    → Server verifies auth (free, but requires sign-in)
    → Downloads image, converts to base64
    → Sends to Gemini 2.0 Flash with vision + knowledge base system prompt
    → Returns { suggestions: [{ title, prompt }] }
  → UI shows 5 selectable cards
  → User picks one → fills textarea → can edit → animates
```

## Files

| File | Purpose |
|------|---------|
| `src/lib/promptKnowledge.ts` | Distilled Kling 3.0 prompting guide as system prompts |
| `app/api/animate/suggestions/route.ts` | POST endpoint for AI prompt suggestions |
| `src/data/animationTemplates.ts` | 25 curated templates across 4 categories |
| `app/(app)/animate/page.tsx` | Animation Studio UI with suggestions + templates |

## Key Decisions

- **Free for users** — Suggestions cost ~$0.001/call on Gemini. Making them free encourages better prompts and reduces wasted animation credits (which cost 5-12 credits each).
- **Gemini 2.0 Flash** — Already integrated in the codebase for classification. Fast (~1-2s), cheap, and has vision capability.
- **Image-aware** — Sends the actual image, not metadata. This produces specific prompts like "the cartoon dinosaur gently bounces" instead of generic "character bounces."
- **Fallback presets** — If Gemini fails, the API returns 5 generic but well-crafted fallback suggestions.
- **Knowledge base pattern** — The prompting guide is a separate module (`promptKnowledge.ts`) that exports functions per use case. Easy to update when Kling releases new versions, and designed to extend to image generation suggestions.

## Template Categories

- **Character** (7): Wave Hello, Gentle Idle, Happy Nod, Jump & Celebrate, Turn Around, Dance Groove, Look Around
- **Camera** (6): Slow Zoom In, Orbit Around, Dramatic Push-In, Pull Back Reveal, Parallax Depth, Dutch Angle
- **Mood** (6): Dreamy Float, Energetic Bounce, Gentle Sway, Dramatic Entrance, Sparkle & Glow, Cozy & Warm
- **Nature** (6): Wind Blowing, Soft Rain, Falling Leaves, Water Ripple, Snowfall, Sunrise Glow

## Future Extensions

- `getGenerationSystemPrompt()` for `/create` page image generation suggestions
- `/api/generate/suggestions` route using the same pattern
- User prompt favorites (save to profile, reuse later)
- Community prompt sharing (public templates)
- Prompt history tracking for analytics on what produces best animations
