# Content Generation Safety — Prompt Composition & Theme Guardrails

> The pattern clip.art uses to enforce kid-safe, culturally-literate, stereotype-free image generation across every content type. Designed to migrate cleanly to `api.esy.com` as part of the ESY generation pipeline.

## Why this doc exists

clip.art is a consumer surface for content that is seen by children, parents, and teachers. Prompt text alone is not sufficient to guarantee safe output — AI image models have well-documented tendencies to drift into tropes, especially when prompts touch on:

- **Cultural themes** (ethnic depictions, music genres, religious holidays)
- **Sensitive social topics** (disability, emotional content, SEL)
- **Kid-focused aesthetics** (which can drift to generic "AI art" photorealism without explicit counter-instructions)

The pattern below addresses this at three layers — prompt injection, per-theme rules, and human review — all wired to the same shared specification files so the rule is enforced in code rather than only in prose.

This pattern ships with worksheets but applies to every content type. When generation moves to `api.esy.com`, the same structure is preserved as ESY's theme-safety library.

## Shared specification files

Three JSON files in `scripts/seed-worksheets/` that travel together and are referenced by every per-topic seed config:

### `_characters.json` — diverse character library

Canonical rotation of 14+ character descriptors, spanning:

- **Seven ethnic backgrounds:** African, South Asian, East Asian, Latino/Latina, Middle Eastern, European, Polynesian (expandable — the list is deliberately not exhaustive, but these seven guarantee coverage of the major visible groups in the US school audience).
- **Two ability tiers:** 50% abled, 50% with a visible disability (wheelchair users, cochlear implant users, white-cane users, kids with prosthetic limbs, neurodivergent kids with noise-canceling headphones, kids with Down syndrome). Disability representation is peer-level — these characters appear in the general rotation for any character-bearing theme, not gated to a "disability worksheet" ghetto.

Every descriptor leads with `"cute cartoon"` so no row can drift photorealistic. A shared `style_suffix` (classic picture-book cartoon style, rounded lines, large expressive eyes) is appended to every character descriptor at prompt-compose time.

### `_safety.json` — guardrail library

Two sections:

- **`global`** — negative-prompt directives that apply to every single render, regardless of theme. Non-negotiable. (No photorealism, no violence, no weapons/alcohol/smoking/gambling, no money imagery, no religious worship scenes, no romantic framing, no cultural stereotyping.)
- **`themes.*`** — per-theme overrides. Each keyed entry has two arrays:
  - `required` — positive framings that **must** appear (injected into prompt as "Positive framing for this theme:").
  - `excluded` — negatives that must not appear (injected into prompt as an appended "Do not depict:" clause, AND used as a visual rejection checklist during human review).

The `themes.hiphop` entry is the first shipped and sets the template for future culturally-sensitive themes (holidays, religious references, mental health, etc.). New sensitive themes are added by appending a new key under `themes.*` rather than re-deriving the rule each time.

### `_themes.json` — shared visual theme pool

The central catalog of reusable visual themes. Each theme has a `phrase` (the text appended to the activity template at compose time) and an optional `safety_ref` that points to a key under `_safety.json`'s `themes.*`. Per-topic configs reference themes by id:

```json
{
  "themes": ["dinosaurs", "pets", "hiphop", "disability-hero"]
}
```

The seed script resolves each id against `_themes.json` and injects the phrase plus any linked safety rules. Per-topic overrides are also supported for edge cases: `{ "id": "hiphop", "phrase": "custom phrase for this topic" }`. This keeps per-topic configs compact (one-line theme ids instead of 20-line theme arrays) and means adding a new theme to the catalog automatically makes it available to every existing and future topic.

## The pattern — three-layer enforcement

```
PROMPT COMPOSITION  ──▶  PROMPT INJECTION     ──▶  HUMAN REVIEW
(seed script)            (generation call)         (two-pass)
     │                         │                        │
     │                         │                        │
     ▼                         ▼                        ▼
Config + templates        Safety block              Rejection checklist
assembled in code         injected as clause        = _safety excluded arrays
```

### Layer 1 — prompt composition

The seed script reads:

1. The topic's per-topic config (`{grade}--{subject}--{topic}.json`) — defines the skill × theme matrix for the topic.
2. The shared `_characters.json` — for any theme that has `"uses_characters": true`, a character is rotated in round-robin.
3. The shared `_safety.json` — the `global` array plus any theme's `safety_ref` (if set).

These are assembled into a single prompt per worksheet.

### Layer 2 — prompt injection

The composed prompt follows this structure (example for a hip-hop music worksheet):

```
printable worksheet for children, portrait 8.5x11, clear title bar, ample writing
space, no answer key, cute cartoon kid-safe illustrations in a warm picture-book
style. Never photorealistic.

Topic: Math — Addition for 1st Grade
Skill: 6 single-digit addition problems, sums ≤ 5, horizontal layout
Visual theme: kid DJ-ing on cute cartoon turntables with big headphones, another
kid breakdancing in a bright colorful tracksuit on a dance floor, music notes and
a friendly cartoon microphone nearby, cute cartoon graffiti on the back wall that
reads "Math!" and "Rhythm!"
Main character: cute cartoon African girl with braided hair, big expressive eyes,
warm smile, age ~6, drawn in a classic picture-book cartoon style, rounded soft
lines, large expressive eyes, warm and friendly vibe
Title shown on worksheet: "Beats & Addition"
Format: portrait 8.5x11, clear title bar, ample writing space, no answer key.
Style: cute cartoon, warm and friendly, large-eyed, rounded soft lines,
picture-book aesthetic. Never photorealistic.

Positive framing for this theme:
- kids are shown having joyful fun making music
- characters wear normal colorful athletic or everyday kid clothes
- graffiti-style text on walls only shows kid-appropriate positive words (Music,
  Rhythm, Math, names, or rainbows/stars)

Do not depict:
- never photorealistic
- never uncanny 3D
- never violent, scary, gory, or sad-to-upsetting
- no weapons, alcohol, smoking, gambling, or money imagery (no dollar signs,
  no cash)
- no religious worship scenes
- no romantic framing between characters
- no cultural or ethnic stereotyping
- no gold chains, bling, or flashy jewelry
- no money imagery of any kind
- no gang-related hand signs or posturing
- no smoke, bottles, or substance-adjacent imagery
- no tough-guy or scowling expressions (every character is cute and smiling)
- no urban decay or derelict street backgrounds
- no backwards-cap + chain combinations or any dress code echoing adult
  rap-video tropes
- no oversized or baggy 'street' stereotypical clothing
```

The key detail: the `Style:` line is re-asserted before the safety block because the safety block is long, and without the re-assertion the model can drift away from "cute cartoon" as a weighting.

### Layer 3 — human review

The same `excluded` arrays that were injected into the prompt are **also** used as a visual rejection checklist during the two-pass review:

- **Pass 1 (per-topic sample):** After the first 10-20 renders for a new topic, a reviewer scans each render against the relevant `excluded` list. If a pattern of violations emerges (e.g. every "beach-kids" render inexplicably has smoke in the background), the theme's config is corrected before the full topic batch runs.
- **Pass 2 (full-seed scan):** After the full batch for a topic is complete, reviewer scans every render one more time. Any render that matches any `excluded` line is regenerated, not cherry-picked around.

This means the list is never a dead letter. The rule lives once, and both the model and the reviewer apply it.

## Hip hop — the worked example

Hip hop in kid content is a well-known AI-generation pitfall. We ship it deliberately — it's a legitimate musical tradition that belongs in curriculum alongside Mozart — but we do it with explicit guardrails. The rules live in `_safety.json` under `themes.hiphop`:

**Required framings (must appear):**

- Kids are shown having joyful fun making music
- Characters wear normal colorful athletic or everyday kid clothes
- Graffiti-style text on walls only shows kid-appropriate positive words (Music, Rhythm, Math, names, rainbows, stars)

**Excluded framings (must not appear):**

- No gold chains, bling, or flashy jewelry
- No money imagery of any kind (no dollar signs, no cash, no stacks)
- No gang-related hand signs or posturing
- No smoke, bottles, or substance-adjacent imagery
- No tough-guy or scowling expressions
- No urban decay or derelict street backgrounds
- No backwards-cap + chain combinations or any dress code echoing adult rap-video tropes
- No oversized/baggy "street" stereotypical clothing

**The principle:** *If it reads like a kid having fun making music, it ships. If it reads like a toned-down version of an adult rap video, it doesn't.*

This template generalizes. When we add new culturally-sensitive themes (specific religious holidays, emotional-health topics, neurodivergence-focused content), we add a new entry under `themes.*` in the same required / excluded shape, and both the prompt composer and the reviewer pick up the new rule automatically.

## Handoff to `api.esy.com`

ESY owns generation post-migration. The safety library structure is preserved intact:

| clip.art (today) | ESY (post-migration) | Notes |
|---|---|---|
| `scripts/seed-worksheets/_characters.json` | `esy/batches/characters/` | Shared across all consumers. |
| `scripts/seed-worksheets/_safety.json` | `esy/batches/safety-library.json` | Same shape (global + themes.*). ESY's review UI surfaces the `excluded` lists as a visual checklist in the HITL queue. |
| `scripts/seed-worksheets/_themes.json` | `esy/batches/themes/` | Shared visual theme pool. Topic configs reference by id. |
| `scripts/seed-worksheets/{topic}.json` | `esy/batches/{client_id}/{topic}.json` | ESY batch definitions. `safety_ref` remains a first-class field. |
| Two-pass human review | ESY HITL queue | The `excluded` arrays drive the "reject this render" options in the HITL UI. |
| Prompt composition | ESY prompt service | The exact composition order (template → skill → theme → character → re-asserted style → safety) is preserved. |

The net effect is that ESY inherits a tested, consumer-validated safety pattern rather than needing to design one in isolation. See [docs/esy/04-migration-tracker.md](../esy/04-migration-tracker.md).

## Adding a new sensitive theme — checklist

When you add a new theme that might need guardrails:

1. Ask: would a naive render of this theme risk stereotype, upsetting imagery, or drift from "cute cartoon"? If yes, continue.
2. Add a new key under `_safety.json` → `themes.*` with `required` and `excluded` arrays.
3. In any topic config that surfaces this theme, set `"safety_ref": "your-theme-key"` on the theme entry.
4. The seed script and the two-pass reviewer automatically pick up the new rules.
5. Document the reasoning in a brief section in this file (under "Worked examples" alongside hip hop).

That's it — no code changes to the seed script required to ship a new safety rule.

## Where to look next

- [WORKSHEETS.md](WORKSHEETS.md) — the worksheets content type, including taxonomy and URL architecture.
- [docs/esy/04-migration-tracker.md](../esy/04-migration-tracker.md) — file-by-file ESY migration status.
- [docs/esy/02-api-contract.md](../esy/02-api-contract.md) — the ESY API contract that will host this pipeline.
