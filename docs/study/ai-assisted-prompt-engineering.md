# AI-Assisted Prompt Engineering

## The Problem

Users waste animation credits on vague or poorly structured prompts. A single animation costs 5–12 credits, and bad prompts produce bad results. The workaround was to manually copy the image to an external AI (like Claude), paste the Kling prompting guide, and ask for 5 suggestions — then copy the best one back. This works but is tedious, breaks the creative flow, and requires prompting knowledge most users don't have.

We needed to bring this entire loop into the app as a one-click feature.

## The Concept: Meta-Prompting

**Meta-prompting** is the pattern of using one AI model to generate prompts for another AI model. Instead of the human writing the prompt directly, they delegate it:

```
Human → AI₁ (prompt writer) → prompt → AI₂ (executor) → output
```

In our case:

```
User imports image → Gemini 2.0 Flash (reads image + knowledge base) → 5 prompts → Kling 3.0 (animates) → video
```

This is a form of **knowledge distillation** — we've compressed a multi-page prompting guide into a system prompt that an AI can use to produce well-structured outputs on demand.

### Why This Works

1. **Vision-language models can see context** — Gemini 2.0 Flash accepts images alongside text. Instead of describing "it's a cartoon dinosaur," the model *sees* the dinosaur and generates prompts specific to it ("the green T-Rex tilts its head curiously").

2. **System prompts encode expertise** — The Kling 3.0 prompting guide contains rules like "use specific verbs," "include camera direction," "keep it under 200 characters." We distill these rules into a system prompt so the model applies them consistently.

3. **Selection is easier than generation** — Choosing from 5 good options is cognitively simpler than writing one from scratch. This is a well-studied UX principle (recognition over recall).

## The Options

### Option A: Client-Side Prompting (No Server)

Send the image directly from the browser to a public AI API.

| Pros | Cons |
|------|------|
| Simpler, fewer moving parts | Exposes API keys in client bundle |
| No server latency | Can't control costs or rate-limit |
| | Can't log or improve suggestions |

### Option B: Server-Side with Text Only

Send only the image metadata (title, category, style) to the AI, not the actual image.

| Pros | Cons |
|------|------|
| Faster (no image download) | Generic prompts — doesn't "see" the image |
| Cheaper per call | Misses visual details like pose, color, expression |
| Works with text-only models | |

### Option C: Server-Side with Vision (What We Chose)

Download the image on the server, send it as base64 to a vision-language model.

| Pros | Cons |
|------|------|
| Image-specific prompts | Slightly slower (~1-2s for image download + inference) |
| Server controls API keys | ~$0.001/call (negligible) |
| Can rate-limit, log, improve | Requires a vision-capable model |
| Knowledge base is updatable without deploys | |

### Option D: Fine-Tuned Model

Train a custom model specifically for generating animation prompts.

| Pros | Cons |
|------|------|
| Potentially higher quality | Expensive to train and maintain |
| Faster inference | Need training data (don't have enough yet) |
| | Can't update knowledge without retraining |

## What We Chose & Why

**Option C — Server-side with vision.** The reasoning:

1. **Security** — API keys stay on the server. Users only call our `/api/animate/suggestions` endpoint.
2. **Quality** — Vision gives image-specific suggestions. "The bouncing banana spins" is dramatically better than "the object moves."
3. **Cost** — Gemini 2.0 Flash is ~$0.001 per call with a small image. Making suggestions free is an easy win for user satisfaction and credit conservation.
4. **Updatability** — When Kling 4.0 launches with new capabilities, we update `promptKnowledge.ts` once. No retraining, no client changes.
5. **Extensibility** — The same pattern works for image generation prompts. We just write `getGenerationSystemPrompt()` and create `/api/generate/suggestions`.

## Code Walkthrough

### 1. Knowledge Base (`src/lib/promptKnowledge.ts`)

This is the distilled expertise. The function returns a system prompt that teaches the AI how to write animation prompts:

```typescript
export function getAnimationSystemPrompt(): string {
  return `You are an expert animation prompt writer for Kling AI...

  RULES:
  1. Every prompt MUST begin with the main subject + primary action
  2. Use specific motion verbs (not "moves" — use "bounces", "sways", "drifts")
  3. Include exactly ONE camera direction per prompt
  4. Keep each prompt to 1-2 sentences, under 200 characters
  5. ...

  RESPOND AS JSON: { "suggestions": [{ "title": "...", "prompt": "..." }] }
  `;
}
```

Key design: the system prompt is a **function**, not a constant. This lets us parameterize it later (e.g., pass the model version, user skill level, or preferred style).

### 2. API Route (`app/api/animate/suggestions/route.ts`)

The server-side endpoint:

```typescript
export async function POST(req: NextRequest) {
  // 1. Auth check (free but requires sign-in)
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 2. Get image URL from request
  const { imageUrl } = await req.json();

  // 3. Download image, convert to base64
  const { base64, mimeType } = await downloadImageAsBase64(imageUrl);

  // 4. Send to Gemini with vision + knowledge base
  const response = await getAI().models.generateContent({
    model: MODEL,
    contents: [{
      role: "user",
      parts: [
        { text: "Generate 5 animation prompts for this clip art image." },
        { inlineData: { mimeType, data: base64 } }
      ]
    }],
    config: {
      systemInstruction: getAnimationSystemPrompt(),
      temperature: 0.8  // creative but not random
    },
  });

  // 5. Parse JSON from response, with fallback
  const suggestions = parseResponse(response);
  return NextResponse.json({ suggestions });
}
```

The `temperature: 0.8` is a deliberate choice — we want creative variety between the 5 suggestions, but not hallucinated nonsense. Lower temperatures (0.2–0.4) would produce 5 nearly identical prompts.

### 3. Fallback Pattern

If Gemini fails (rate limit, outage, parse error), we return 5 pre-written generic suggestions:

```typescript
const FALLBACK_SUGGESTIONS = [
  { title: "Gentle Motion", prompt: "The character gently sways side to side..." },
  // ...
];
```

This ensures the UI never shows an error state for a "nice to have" feature. The user can always fall back to templates or manual writing.

### 4. Template Library (`src/data/animationTemplates.ts`)

For when users want quick, predictable prompts without waiting for AI:

```typescript
export const ANIMATION_TEMPLATES: AnimationTemplate[] = [
  { id: "wave", category: "character", label: "Wave Hello",
    prompt: "The character raises one hand and waves..." },
  { id: "zoom-in", category: "camera", label: "Slow Zoom In",
    prompt: "Slow cinematic zoom toward the subject..." },
  // ... 25 total across 4 categories
];
```

Templates are curated by humans, not generated. They use the same Kling prompting best practices but are designed to work well with *any* image.

## Mental Model: The Expertise Funnel

Think of AI-assisted prompt engineering as a funnel that concentrates expertise:

```
┌─────────────────────────────────┐
│   Expert Knowledge              │  ← Kling prompting guide, best practices
│   (pages of documentation)      │
├─────────────────────────────────┤
│   System Prompt                 │  ← Distilled into ~500 words of rules
│   (promptKnowledge.ts)          │
├─────────────────────────────────┤
│   Vision Model + Image          │  ← Applies rules to specific context
│   (Gemini 2.0 Flash)           │
├─────────────────────────────────┤
│   5 Tailored Suggestions        │  ← User picks one, edits if needed
│   (recognition over recall)     │
├─────────────────────────────────┤
│   Better Animation              │  ← Fewer wasted credits
└─────────────────────────────────┘
```

This pattern is reusable anywhere you have:
- An AI executor that needs good prompts
- Domain knowledge about what makes a "good prompt"
- A vision or multimodal model that can understand context

Examples beyond animation: image generation suggestions, SEO title suggestions, alt-text generation, email subject line optimization.

## Key Tradeoffs to Remember

| Decision | Tradeoff |
|----------|----------|
| Free suggestions | Costs us ~$0.001/call but saves users 5-12 credits per bad animation avoided |
| Vision over text-only | +1-2s latency but dramatically better quality |
| JSON response format | Structured output is parseable but models occasionally break format (hence fallback) |
| Temperature 0.8 | Creative variety but occasionally over-imaginative suggestions |
| Server-side only | Secure but adds a network round-trip vs client-side |
| Templates as static data | Fast and reliable but requires manual curation to expand |

## Further Reading

- [Kling 3.0 Prompting Guide](https://blog.fal.ai/kling-3-0-prompting-guide/) — The source material we distilled
- [Google Gemini Vision Docs](https://ai.google.dev/gemini-api/docs/vision) — How multimodal inputs work
- [Recognition Over Recall](https://www.nngroup.com/articles/recognition-and-recall/) — The UX principle behind offering choices
- [Prompt Engineering Guide](https://www.promptingguide.ai/) — General prompt engineering patterns
- [Chain-of-Thought Prompting](https://arxiv.org/abs/2201.11903) — Related technique for structured AI outputs
