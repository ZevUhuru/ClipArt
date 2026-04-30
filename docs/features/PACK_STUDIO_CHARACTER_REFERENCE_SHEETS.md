# Pack Studio Character Reference Sheets

## Goal

Pack Studio should make character reference sheet packs feel like a first-class creation path, not a generic clip art batch with a different title.

The target output is a commercially useful character reference bundle:

- One cohesive character identity.
- A contact-sheet style reference board.
- Multiple angles, poses, expressions, and detail callouts.
- Optional individual PNG-style assets that can be reused in AI video, storyboards, classroom stories, games, brand mascots, and creator packs.

This builds on the broader strategy in `docs/strategy/CHARACTER_SHEET_PACKS.md`.

## Why Now

ChatGPT Images 2.0 / `gpt-image-2` is especially strong at single-image expansion into structured design boards: turnarounds, expression grids, palettes, detail studies, and labeled reference sheets.

That capability maps directly to a high-value clip.art bundle format. A creator does not only need "a character"; they need the same character to stay consistent across a workflow. Character sheets solve drift.

## Product Promise

> Turn a character idea into a cohesive reference-sheet pack for AI video, stories, games, mascots, and classroom content.

The Pack Studio version of this promise should be practical and seller-focused:

- It should generate a reference sheet / contact sheet as one hero asset.
- It should generate individual supporting assets for the same character.
- It should default to pack-exclusive usage because these bundles have paid-pack value.
- It should keep prompts inspectable so creators can understand why a pack stays cohesive.

## V1 Behavior

### Entry Point

The existing `Consistent Character Sheet Pack` starter remains the main entry point.

When a creator selects that starter, Pack Studio should:

- Set the title, description, tags, audience, and pack goal.
- Preload character-reference prompt rows.
- Use `GPT Image 2` as the generation model.
- Use a style that supports expressive characters.
- Add shared style notes that ask for one consistent identity.
- Add avoid rules for common reference-sheet failure modes.
- Keep all generated assets visually cohesive.

### Recommended Model Routing

For normal clip art packs, `Recommended` can continue using the app's style routing.

For packs whose goal is `Character sheet`, `Recommended` should route to `gpt-image-2` in Pack Studio. This is intentionally scoped to the Pack Studio request body rather than changing the global style router in `src/lib/styles.ts`.

Why scoped:

- Character sheets are a specialized pack workflow.
- Global clip art routing still favors cheaper volume generation.
- ESY will eventually own provider routing, so this should stay close to the UI workflow for now.

### Prompt Shape

Generic pack generation prompts should still create one asset per row.

For character sheet packs, the prompt builder should add reference-sheet guidance:

- Preserve one consistent character identity across all rows.
- Ask for clear turnaround / expression / pose language.
- Allow useful labels only when the row asks for a reference board.
- Prefer clean white studio-board layouts over scenes.
- Avoid duplicate poses, unreadable labels, random extra characters, watermarks, and messy backgrounds.

### Default Rows

The V1 preset should include rows that can form a sellable starter pack:

- Full character reference sheet board.
- Front view.
- Side view.
- Back view.
- Three-quarter view.
- Expression grid.
- Action pose set.
- Detail/accessory sheet.

The rows should be editable. They are a starting point, not a locked template.

## Non-Goals

V1 does not add image upload/reference-image input to Pack Studio. The current generation API path is prompt-only. True single-image-to-reference-sheet generation should be handled when clip.art delegates generation to ESY.

V1 also does not add:

- A new database content type.
- A new pack type enum.
- A server-side job table.
- AI quality scoring.
- Custom cover collage generation.

## Future ESY Version

When generation moves fully behind `api.esy.com`, this workflow should become an ESY job type:

- Input: character prompt plus optional reference image.
- Output: approved reference board plus individual pack assets.
- Routing: ESY selects the best provider/model for reference expansion.
- Review: ESY evaluates identity consistency, pose coverage, label readability, and commercial usefulness.
- Delivery: clip.art receives the final assets, metadata, transparency state, and ZIP-ready pack membership.

The clip.art UI should keep the same high-level behavior: creators choose a character sheet starter, edit rows, inspect prompts, and publish a bundle.

## Implementation Checklist

- Add a character reference sheet plan document.
- Link the plan from `docs/README.md`.
- Add constants for the character sheet goal, GPT Image 2 model preference, preset prompt rows, shared style notes, and avoid rules.
- Detect character sheet packs in Pack Studio from `packGoal`.
- Update starter selection to preload character-sheet generation settings.
- Route `Recommended` to `gpt-image-2` for character sheet packs.
- Add character-sheet prompt guidance in `buildPackGenerationPrompt`.
- Add a Generate-tab callout and one-click setup button for existing character sheet packs.
- Run lint or targeted diagnostics on edited files.
