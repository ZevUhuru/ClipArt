# lazy.dev — Product Brief

**Status:** Pre-build. Personal v1 target: this week. Product launch: ~12 months of personal use first.

---

## What it is

A "build in public" platform for developers. Low-friction input from wherever you already work (terminal, Obsidian, API) → curated, elegant public output. GitHub shows *what* you committed. lazy.dev shows *why* — the intent, context, and thinking behind the work.

The tagline: structured narrative on top of raw activity.

---

## The problem it solves

Most developers don't maintain public work journals because the friction is too high. Formatting, context-switching, figuring out what to say — it kills the habit. lazy.dev removes the input friction by accepting raw notes in any form and using AI to structure them. The output is a public page that tells a richer story than a GitHub profile ever could.

---

## Core content model

```
Org
 └── Project (clip.art, esy.com, lazy.dev...)
      └── Feature (bg removal, transparency support...)
           ├── Notes (tagged, timestamped, from any input surface)
           ├── Todos (open/done)
           └── Journal entries (daily, free-form)
```

This is the spine. All input surfaces write to it. The public page reads from it.

---

## Input surfaces

Ranked by build priority:

1. **API** — everything else sits on top of this. One authenticated POST endpoint accepting free-form text + optional tags (`project`, `feature`, `type`). AI (Gemini or GPT) structures it into the content model.
2. **CLI** — `lazy log "shipped bg removal for clip.art" --feature bg-removal` from any terminal. The tool you'll reach for without thinking.
3. **Obsidian sync** — folder-watch script or community plugin that syncs daily notes to the API. Build this when the absence is actually painful (estimated month 3–4).
4. **Web UI** — for managing features/todos and previewing the public page. Needed but not the interesting part.

---

## The public page

Not a raw activity feed. A curated, elegant profile:

- **Activity heatmap** — GitHub-style grid, but per feature/project rather than per commit
- **Feature cards** — status (shipped/in-progress/planned), linked notes, ship date
- **Goals / roadmap** — public, versioned, living
- **Recent journal** — what you're thinking about, not just what you shipped
- **Org bio** — the projects, the domains, the story

Accessible at `lazy.dev/{handle}`. Each org can associate multiple product domains (e.g. clip.art, esy.com) so the page becomes the canonical "what I'm building" surface.

---

## Organization model

- Create an **org** (personal or team)
- Associate it with any number of **project domains**
- Projects map to repos, products, or whatever makes sense
- The org page is public by default; individual notes/todos can be marked private

---

## AI layer

The POST `/api/log` endpoint:
- Accepts raw text (brain dump, voice transcript, Markdown notes, structured or not)
- Calls AI to extract: project, feature, type (note / journal / todo / shipped), title, body, tags
- Saves structured entry to Supabase
- Returns the structured entry for CLI confirmation display

The AI prompt layer gets better over time. 12 months of personal use = a real corpus of input patterns to tune against.

---

## Integration with ESY ecosystem

lazy.dev is **ESY consumer #2**. clip.art is consumer #1. The whole point of building ESY as separate infrastructure is that the execution plane gets built once and every ESY LLC product consumes it. lazy.dev validates that architecture.

**api.esy.com** — lazy.dev's AI structuring step (raw notes → structured entry) calls `POST api.esy.com/generate` with a text content type. ESY handles provider routing, retries, cost tracking. lazy.dev should not build its own AI layer. This also forces ESY to generalize beyond image artifacts, which it needs to do for future consumers anyway.

**app.esy.com** — the dashboard now manages two consumers (clip.art + lazy.dev), which makes it feel like real infrastructure rather than a clip.art admin panel. A "log today's work" widget in the dashboard posts to the lazy.dev API — one form, one POST.

**clip.art session docs** (`docs/sessions/YYYY-MM-DD/README.md`) — the natural raw input format. lazy.dev API publishes them externally, with ESY handling the AI structuring pass for a public audience.

**The infrastructure proof**: esy.com, clip.art, lazy.dev all calling `api.esy.com`. That's what makes ESY infrastructure and not just clip.art internals with a different name. lazy.dev isn't a distraction from ESY — it's a second data point that validates the whole architecture before external customers arrive.

---

## Build order (MVP)

1. Supabase schema: `orgs`, `projects`, `features`, `entries`
2. POST `/api/log` — raw text in, structured entry out, saved to DB
3. CLI wrapper — `npx lazy log "..."` (or global install `lazy`)
4. Public org page at `lazy.dev/{handle}` — activity feed + feature cards
5. Web UI — feature/todo management, page preview
6. Obsidian sync — when its absence is actually annoying

With Claude Code, steps 1–4 are a focused afternoon.

---

## What to defer (v2+)

- Real-time GitHub commit ingestion
- Team/multi-user orgs
- Comments and reactions from visitors
- Analytics on page views
- Marketplace / discovery feed across all lazy.dev users

---

## Phased roadmap

| Phase | Timeline | Goal |
|-------|----------|------|
| Personal v1 | This week | API + CLI + public page live at lazy.dev/zev |
| Daily habit | Months 1–3 | Log every feature shipped across all ESY products |
| Content model refinement | Months 3–6 | Obsidian sync, tune AI structuring on real input corpus |
| Product signals | Months 6–12 | Does the public page feel useful? What's missing? |
| Open to other devs | ~Month 12 | Ship the workflows built along the way as the product |

---

## Key insight for productization

12 months of personal use produces:
- A real content model that emerged from usage, not speculation
- An AI prompt layer battle-tested on messy real input (brain dumps at midnight ≠ polished announcements)
- A portfolio of output to show prospective users ("here's 12 months of my work, structured automatically")
- A corpus of real inputs to train parsing against — the moat when you open it up

---

*Created: 2026-04-26. Discussed in clip.art Cursor session.*
