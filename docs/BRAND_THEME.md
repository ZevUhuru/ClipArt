# clip.art Brand Theme

This guide captures the current visual direction for clip.art after the homepage visual discovery upgrade and the Pack Studio workspace redesign. Use it when designing public pages, in-app creation surfaces, detail pages, and marketplace/bundle experiences.

## Brand Position

clip.art is a practical creative workspace for reusable clip art: transparent PNGs, visual discovery, generation, packs, and everyday project use.

The brand should feel:

- Useful before promotional.
- Image-led rather than text-card heavy.
- Warm, polished, and lightweight.
- Focused on clip art as the core product.
- Fast to scan for teachers, creators, small businesses, crafters, and internal operators.

## Visual Principles

### 1. Show The Art

Use real clipart as product proof wherever possible. Prefer mosaics, thumbnail strips, image stacks, and category previews over text-only cards.

Good patterns:

- Editorial mosaics with one larger anchor tile and smaller supporting tiles.
- Category cards with 2-3 representative images.
- Use-case cards with small image strips.
- Prompt/style discovery paired with example thumbnails.
- Final CTAs with small visual proof, not only copy.

Avoid:

- Large stretches of plain text cards.
- Generic icon-only feature blocks when real clipart is available.
- Repeating the same 6-8 images across the whole page.

### 2. Public Pages Can Sell, App Pages Should Work

Public marketing and SEO pages may use stronger headlines, dramatic spacing, and bigger visual proof.

In-app surfaces should feel like daily workspaces:

- Calm headings.
- Operational copy.
- Compact persistent actions.
- Minimal hype.
- Clear task progress.

Avoid promotional language inside the app. The user is already signed in and trying to get work done.

### 3. Clipart-First Hierarchy

Homepage, explore, create, and pack surfaces should lead with clip art. Secondary formats can remain discoverable, but they should not compete with clip art as the primary business focus.

Secondary formats:

- Coloring pages.
- Worksheets.
- Illustrations.
- Animations.

Keep them in compact strips, footer links, SEO routes, and contextual cross-links.

## Color System

### Primary Neutrals

- Page background: `#fbfaf9` or white.
- Surface: `bg-white`.
- Soft surface: `bg-gray-50`, `bg-gray-50/70`, `bg-gray-50/80`.
- Borders: `border-gray-100`, occasionally `border-gray-200` for form controls.
- Body text: `text-gray-500`, `text-gray-600`.
- Headings: `text-gray-950` on public pages, `text-gray-800` in app/workspace pages.

### Accent Colors

- Pink: primary brand accent for clipart discovery, CTAs, active states, and labels.
- Orange: secondary warmth for quality facts, packs, and format proof.
- Green: status only, such as ZIP ready, published, successful actions.

Recommended Tailwind patterns:

- `text-pink-500`, `text-pink-600`
- `bg-pink-50`, `bg-pink-50/50`, `border-pink-100`
- `text-orange-500`, `bg-orange-50`, `border-orange-100`
- `text-green-600`, `bg-green-50`, `border-green-100`

### Dark Surfaces

Use dark surfaces sparingly.

Good uses:

- Homepage hero over mosaic/video background.
- Marketing footer.
- Occasional public dramatic CTA if it does not fight the page.

Avoid dark panels in daily app/workspace surfaces. Pack Studio, library, editor, and admin-like workflows should use calm light surfaces.

## Typography

### Public Pages

Public pages can use stronger headline weight and scale:

- Hero and major section headings: `font-black`, `tracking-tight`, large sizes.
- Eyebrows: small uppercase, wide tracking, pink/orange/gray accents.
- Body copy: concise, practical, benefit-driven.

### App / Workspace Pages

In-app UI should be calmer:

- Main headings: `font-semibold`, `text-gray-800`.
- Avoid `font-black` except for small labels or rare emphasis.
- Copy should be operational: what the user can do next, what state the object is in, what is missing.

Examples:

- Good: "Create or continue a clipart pack."
- Good: "Daily workspace for the pack brief, assets, cover, and publish readiness."
- Avoid: "Build a clipart pack people instantly understand."
- Avoid: "Define the product before the images."

## Layout Patterns

### Image Mosaics

Use when the page needs to feel visual and premium.

Preferred structure:

- Rounded outer shell: `rounded-[2rem]`.
- White or soft-gray surface.
- Inner grid with `gap-2`.
- One or two larger anchor tiles using `col-span-2 row-span-2`.
- Clipart images use `object-contain` with `p-2` or `p-3`.

### Transparency Preview Backgrounds

Transparent clip art should use the checkerboard preview background as the default display surface. This is the standard visual cue that the image has no baked-in background and prevents users from mistaking a dark or colored preview surface for part of the asset.

Use:

- `bg-transparency-grid` for clipart cards, mosaics, and detail-page image previews.
- `bg-transparency-grid-sm` for small swatches in preview controls.
- White preview only as an alternate inspection mode, especially when users want to see how the asset reads on a printable or document-like surface.

Avoid:

- Dark backgrounds as the default "transparent" state.
- Prompting models to render checkerboards. The checkerboard is a UI preview surface only, never part of generated artwork.

### Category Tiles

Category tiles should show representative artwork before text.

Structure:

- Mini image grid at top.
- Category label.
- `Category Name Clip Art` heading.
- Short practical use case copy.
- Clear link affordance.

### Workspace Panels

Use for app surfaces like Pack Studio.

Preferred structure:

- Background: `#fbfaf9`.
- Panels: white cards with subtle `border-gray-100`.
- Shadows: subtle (`shadow-sm`) unless elevation is needed.
- Active states: pink-tinted (`bg-pink-50`, `ring-pink-100`), not black.
- Persistent actions: compact floating rail, not full-width footer bars.

### Forms

Forms are important and should feel clean:

- Rounded controls: `rounded-2xl`.
- Border: `border-gray-200`.
- Background: `bg-gray-50/70` or white.
- Focus: `focus:border-pink-300 focus:ring-2 focus:ring-pink-100`.
- Labels: small, uppercase, gray.

## Copy Voice

### Public Page Voice

Clear, confident, and practical. Sell through usefulness and visual proof, not hype.

Use:

- "Browse clip art by what you need to make."
- "Reusable artwork should look ready before you download."
- "Build with sets, not scattered singles."

Avoid:

- Overly generic SaaS claims.
- Vague "world class" copy.
- Dense paragraphs without visual support.

### App Voice

Short, direct, task-oriented.

Use:

- "Add assets to this pack."
- "Generate a starter batch from the brief."
- "Set the cover, fill missing brief fields, then publish."
- "Basic context used for generation, organization, and publishing."

Avoid:

- Marketing headlines.
- Sales language.
- Anything that tries to convince signed-in users why the feature matters.

## Component Guidance

### Buttons

Primary CTAs can use `btn-primary` or brand gradient.

Secondary actions:

- Use white/gray buttons with subtle border.
- Use pink-tinted buttons for selected/search actions.
- Avoid black buttons in app surfaces.

### Cards

Cards should not become a generic wall. Mix card sizes and visual density.

Use:

- Image-first cards.
- Asymmetric grids.
- Text cards only when they support a visual section.

Avoid:

- Repeated equal-height text cards across multiple consecutive sections.

### Links

Links should be descriptive and accessible. Image-only links need `aria-label` if visible text is absent. Text links should make the destination clear.

## Current Reference Surfaces

Use these as the strongest references:

- Homepage below-hero visual discovery in `app/page.tsx`.
- Pack Studio entry and workspace in `app/(app)/create/packs/page.tsx`.
- Marketing footer for public closeout tone, not in-app surfaces.

## Do / Do Not

Do:

- Let images carry the product story.
- Keep app workspaces calm and useful.
- Use warm whites, soft grays, pink/orange accents.
- Make every section answer "what can I make or find here?"
- Prefer compact, persistent workspace actions over heavy bars.

Do not:

- Turn app pages into marketing landing pages.
- Use black panels or black active tabs in the app.
- Ship large sections of text-only cards when images are available.
- Give secondary formats equal homepage weight while clip art is the focus.
- Hide important actions behind decorative UI.
