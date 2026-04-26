# Worksheets — Content Type

> clip.art's worksheets content type. Subject × Grade × Topic taxonomy, grade-first URLs, PDF download, and a structured content-generation pipeline designed to hand off cleanly to `api.esy.com`.

## Why worksheets are different from clipart, coloring, or illustrations

Clipart, coloring pages, and illustrations are **visual artifacts** — a single image is the product. The taxonomy for those types is thematic (animals, fantasy, dinosaurs).

Worksheets are **functional artifacts** — a printable work product used by a kid (or a teacher/parent with a kid) to practice a skill. Users don't search for "a worksheet" — they search for "1st grade math addition worksheets," "kindergarten phonics letter tracing," "3rd grade reading comprehension." The discovery shape is Subject × Grade × Topic.

This drives every architectural decision below.

## Taxonomy — Subject × Grade × Topic

Three axes, grade-first in URL architecture (validated by keyword research in `docs/features/COLORING_PAGES_SEO.md` and the worksheet CSVs under `.cursor/plans/worksheets_*`).

**Grades** (7 at launch): `prek`, `kindergarten`, `1st-grade`, `2nd-grade`, `3rd-grade`, `4th-grade`, `5th-grade`.

**Subjects** (6 at launch): `math`, `reading`, `writing`, `science`, `spelling`, `phonics`. `english` is used in a few very-high-volume legacy SERPs (e.g. "3rd grade english worksheets") and is kept as an alias of `reading` for now; canonical URLs use `reading`.

**Topics** — curated per Subject × Grade cell, driven by keyword volume. Example: `/2nd-grade/math/addition`, `/3rd-grade/reading/reading-comprehension`, `/prek/phonics/letter-recognition`. The MVP ships ~40 topic hubs across the top-volume cells.

## URL architecture

Four levels deep, plus detail. Grade-first matches every high-volume query shape.

| Level | Pattern | Purpose | Example |
|---|---|---|---|
| Landing | `/worksheets` | Entry + grade overview | `/worksheets` |
| Grade hub | `/worksheets/[grade]` | Lands "1st grade worksheets" class of query | `/worksheets/1st-grade` |
| Subject hub | `/worksheets/[grade]/[subject]` | Lands "1st grade math worksheets" — the highest-volume shape | `/worksheets/1st-grade/math` |
| Topic hub | `/worksheets/[grade]/[subject]/[topic]` | Long-tail, lowest KD | `/worksheets/1st-grade/math/addition` |
| Detail | `/worksheets/[grade]/[subject]/[topic]/[slug]` | Individual worksheet PDF | `/worksheets/1st-grade/math/addition/farm-animals-addition-abc123` |

**Detail pages always sit under a topic.** This is a departure from the coloring-pages two-level pattern (`/coloring-pages/[theme]/[slug]`) — the deeper hierarchy is mandatory for worksheet SEO because keyword volumes only justify topic pages, and because detail pages need a parent breadcrumb that matches how users search.

## Data model

### `generations` table additions

Three new nullable columns — only populated for `content_type = 'worksheet'` rows:

- `grade` (text) — one of the seven slugs above
- `subject` (text) — one of the six subject slugs
- `topic` (text) — topic slug within the Subject × Grade cell

Indexes:

- `idx_generations_grade_subject_topic_public` — composite on `(grade, subject, topic, is_public)` where `content_type = 'worksheet'`
- `idx_generations_worksheet_grade_public` — composite on `(grade, is_public)` for grade-hub queries

### `categories` table rows

Three tiers of category rows, all with `type = 'worksheet'`:

- **Grade hubs** — one row per grade (7 rows), slug = grade slug
- **Subject hubs** — one row per (grade, subject) pair, slug = `{grade}--{subject}` to avoid slug collisions
- **Topic hubs** — one row per (grade, subject, topic) triple, slug = `{grade}--{subject}--{topic}`

Each row carries the standard SEO columns: `h1`, `meta_title`, `meta_description`, `intro`, `seo_content` (paragraph array), `suggested_prompts`, `related_slugs`.

Slug format uses `--` (double hyphen) as the level separator so the categories table preserves its single-column primary key while still disambiguating e.g. `1st-grade--math` from any standalone `math` row that might land in a different content type later.

### Lookup helpers (`src/lib/categories.ts`)

```ts
getWorksheetGrades(): Promise<DbCategory[]>
getWorksheetGradeBySlug(slug: string): Promise<DbCategory | null>
getWorksheetSubjects(grade: string): Promise<DbCategory[]>
getWorksheetSubjectBySlug(grade: string, subject: string): Promise<DbCategory | null>
getWorksheetTopics(grade: string, subject: string): Promise<DbCategory[]>
getWorksheetTopicBySlug(grade: string, subject: string, topic: string): Promise<DbCategory | null>
```

Every helper filters by `type = 'worksheet'` and scopes to the parent level via slug prefix match.

## Content-type integration (`src/lib/styles.ts`)

Worksheets are a first-class `ContentType`:

```ts
export type ContentType = "clipart" | "illustration" | "coloring" | "worksheet";

CONTENT_TYPE_TEMPLATES.worksheet =
  "printable worksheet for children, portrait 8.5x11, clear title bar, ample writing space, no answer key, cute cartoon kid-safe illustrations in a warm picture-book style. Never photorealistic.";

VALID_STYLES.worksheet = ["cartoon"];       // locked to cute cartoon
CONTENT_TYPE_ASPECT.worksheet = "3:4";      // portrait
STYLE_MODEL_MAP.worksheet_default = "gpt-image-2";  // best text rendering
```

The style is locked to one value at launch (`cartoon`, routed through the worksheet template). This is intentional: users don't come to worksheets for aesthetic variety the way they do for clipart — they come for a specific skill-at-grade, and the aesthetic should be consistent across the library.

`gpt-image-2` is the default model because worksheets must render text (problem numbers, instructions, title bars). GPT Image 2 is meaningfully better at legible text than Gemini 3.1 Flash Image at this tier.

## UI surfaces

### Create flow

- `app/(app)/create/worksheets/page.tsx` — new create page with Grade / Subject / Topic selectors above the prompt input.
- `src/components/CreateModeToggle.tsx` — the persistent content-type tab row gets a fourth entry: Worksheets. Already present as a pattern; just adds a `Worksheets` tab.

### Browse surfaces

- `app/worksheets/page.tsx` — landing. H1 "Free Printable Worksheets." Grade tiles → subject hubs.
- `app/worksheets/[grade]/page.tsx` — grade hub. H1 "Free 1st Grade Worksheets." Subject tiles + mixed gallery of top worksheets across all subjects at that grade.
- `app/worksheets/[grade]/[subject]/page.tsx` — subject hub. H1 "Free 1st Grade Math Worksheets." Topic tiles + gallery.
- `app/worksheets/[grade]/[subject]/[topic]/page.tsx` — topic hub. H1 "Free 1st Grade Addition Worksheets." Full gallery of worksheets for that topic.
- `app/worksheets/[grade]/[subject]/[topic]/[slug]/page.tsx` — detail. Hero image + "Download PDF" as primary CTA + metadata strip (grade badge, subject badge, topic badge) + related worksheets + skill description + JSON-LD.

### Components

- `src/components/WorksheetDetailPage.tsx` — new component (not a reuse of `ImageDetailPage` — detail differs: PDF download is primary, clipart download is secondary, breadcrumb is 4-level, metadata strip is the distinguishing UI).
- `src/components/WorksheetHubPage.tsx` — one component shared across grade/subject/topic hubs, parameterized by level (1 = grade, 2 = subject, 3 = topic).

### Navigation

- `src/components/CategoryNav.tsx` — Worksheets entry added to both authed and anon mobile menus.
- `app/page.tsx` "What you can do with clip.art" section — extended from 3 tiles to 4 to include Teach with Worksheets linking to `/worksheets`.

## Sitemap

`app/sitemap.ts` gets five new sections:

1. Landing (`/worksheets`, priority 0.95)
2. Grade hubs (priority 0.9)
3. Subject hubs (priority 0.9)
4. Topic hubs (priority 0.9)
5. Detail pages (priority 0.5)

## Generation pipeline

See [CONTENT_GENERATION_SAFETY.md](CONTENT_GENERATION_SAFETY.md) for the full prompt-composition + safety-enforcement pattern, which is the piece that hands off to `api.esy.com` later.

The short version:

1. Each topic hub has a JSON config at `scripts/seed-worksheets/{grade}--{subject}--{topic}.json` specifying the skill × theme matrix for that topic.
2. The seed script composes a prompt per worksheet by combining: the worksheet content-type template, the skill, the visual theme, an optionally-rotated character from the shared `_characters.json`, and the safety block from `_safety.json` (global + any theme-specific rules).
3. The prompt goes through the normal `/api/generate` pipeline, which writes to `generations` with `content_type='worksheet'` and the new `grade`/`subject`/`topic` columns populated from the config.
4. Two-pass review: per-topic sample scan (reject obvious failures before the full batch runs), then full-seed scan (reject or regenerate anything that violates the safety-excluded rules).

## Seed design (launch target: ~1,000 worksheets)

Organized in four tiers weighted by keyword volume and ranked difficulty. See the plan document for the full tier A/B/C/D breakdown. Mandatory floors across all tiers:

- **≥ 10% SEL coverage** across each topic (emotional understanding, caring for others, disability inclusion, friendship/community). Enforced by the seed script via a `min_sel_count` field per topic config.
- **~20% seasonal distribution** spread evenly across all four seasons (spring, summer, fall/autumn, winter) — plus back-to-school, Christmas, and other holiday windows nested inside the matching season.
- **Character diversity** — every character-bearing theme pulls from `_characters.json` round-robin: half abled, half disabled, evenly spread across African, South Asian, East Asian, Latino/Latina, Middle Eastern, European, and Polynesian backgrounds.
- **"Cute cartoon" aesthetic** — enforced at three layers: the base content-type template, every character descriptor, and every theme descriptor. Never photorealistic, never uncanny 3D.

## Post-ESY-migration responsibilities

When the generation pipeline migrates to `api.esy.com`, responsibility splits as follows:

| Piece | Post-migration owner | Notes |
|---|---|---|
| `ContentType = 'worksheet'` in `src/lib/styles.ts` | clip.art (shared contract) | ESY must mirror. |
| `CONTENT_TYPE_TEMPLATES.worksheet` | clip.art (shared contract) | ESY reads via API contract, doesn't fork. |
| `/api/generate` dispatch for worksheets | ESY | Thin proxy in clip.art. |
| `scripts/seed-worksheets/` (configs, script, `_safety.json`, `_characters.json`) | ESY | Configs become ESY batch definitions; `_safety.json` pattern becomes ESY's theme-scoped safety library. |
| `generations` table worksheet rows | clip.art | Display-layer metadata stays here. ESY writes through. |
| Browse surfaces + sitemap + JSON-LD | clip.art (permanent) | Never moves. |

See [docs/esy/04-migration-tracker.md](../esy/04-migration-tracker.md) for the full migration tracker.
