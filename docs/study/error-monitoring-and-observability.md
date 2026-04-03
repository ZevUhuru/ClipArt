# Error Monitoring & Observability

## The Problem

Our animation system sends jobs to a third-party API (Fal.ai) that can take 1–5 minutes to complete. Sometimes jobs hang for 15+ minutes or fail silently. Users spend credits and get nothing back. We had no way to know this was happening — `console.error` prints to Vercel function logs that disappear after 1 hour. By the time we checked, the evidence was gone.

More broadly: any production web app generates errors that no one is watching. A user hits a bug at 3am, closes the tab, and you never find out. The question isn't whether errors happen — it's whether you know about them.

## The Concept: Observability

**Observability** is the ability to understand what's happening inside your system by looking at its outputs. It's built on three pillars:

1. **Logs** — Timestamped text records of events ("Animation xyz timed out at 3:42am")
2. **Metrics** — Numeric measurements over time ("95% of animations complete in under 3 minutes")
3. **Traces** — End-to-end paths through your system ("This request hit the API route → called Fal.ai → waited 20 minutes → timed out → refunded credits")

`console.log` gives you pillar 1 — but only if you're watching at the exact moment, and only for about an hour. Sentry gives you all three, permanently.

### Why Not Just Check the Database?

You *can* query your `animations` table for `status = 'refunded'` and piece together what happened. But this is reactive — you only look when something seems wrong. Observability is proactive: the system tells *you* when something is wrong.

Think of it like a car dashboard. You could check your oil level manually every morning, or you could have a warning light that turns on when it's low. Both work, but one scales and the other doesn't.

## The Options

### 1. Do Nothing (console.log only)
- **Cost**: $0
- **Retention**: ~1 hour on Vercel
- **Alerting**: None
- **Search**: None
- **Verdict**: Fine for solo development. Dangerous once real users are spending money.

### 2. Structured Logging Service (Axiom, BetterStack)
- **Cost**: Free tier available
- **What it does**: Ingests and indexes your logs so they're searchable and persistent
- **Gap**: No automatic error grouping, no stack traces, no alerting out of the box
- **Best for**: Infrastructure debugging ("show me all requests that took >5s")

### 3. Error Monitoring (Sentry)
- **Cost**: Free tier — 5,000 errors/month
- **What it does**: Captures errors with full context, groups duplicates, alerts you, tracks trends
- **Gap**: Not designed for general-purpose log search
- **Best for**: Knowing when things break and understanding why

### 4. Full Observability Platform (Datadog, New Relic)
- **Cost**: $$$
- **What it does**: Everything — logs, metrics, traces, APM, infrastructure monitoring
- **Gap**: Overkill and expensive for early-stage apps
- **Best for**: Large teams with complex distributed systems

## What We Chose & Why

**Sentry** — because our primary need is knowing when user-facing operations fail (animations, generations, credit charges). We don't need general log search yet. Sentry's free tier handles our volume, the Next.js SDK is first-class, and it gives us the highest-value features immediately: error grouping, alerting, and user impact tracking.

If we later need structured log search (e.g., "show me all animations from user X in the last week"), we'd layer Axiom on top.

## How Sentry Works

### The Mental Model

Think of Sentry as a specialized database for errors. Every time something goes wrong, you send Sentry a structured "event" containing:

- **What** happened (error message, stack trace)
- **Where** it happened (file, line, function)
- **Who** was affected (user ID, session)
- **When** it happened (timestamp)
- **Context** (tags, extra data you attach)

Sentry then:
1. **Deduplicates** — Groups identical errors into a single "issue"
2. **Counts** — Tracks how many times each issue occurs and how many users are affected
3. **Alerts** — Notifies you when new issues appear or existing ones spike
4. **Preserves** — Keeps everything permanently (within your plan limits)

### Automatic vs Manual Capture

Sentry has two modes:

**Automatic capture** — The SDK wraps your app and catches any unhandled exception. If your API route throws and you don't catch it, Sentry captures it with the full stack trace. This works out of the box with zero code changes.

```typescript
// This error is automatically captured by Sentry
export async function GET() {
  const data = await fetch("https://api.example.com/broken");
  return data.json(); // throws if response isn't JSON — Sentry catches it
}
```

**Manual capture** — You explicitly send events for situations that aren't "errors" in the code sense but are important to track. A timeout is a controlled code path (not a crash), but you still want to know about it.

```typescript
import * as Sentry from "@sentry/nextjs";

// Not a crash, but we want to track it
Sentry.captureMessage("Animation timed out", {
  level: "warning",
  tags: { type: "animation_timeout", model: "kling-3.0-pro" },
  extra: {
    animationId: "abc-123",
    userId: "user-456",
    elapsedMinutes: 22,
    creditsRefunded: 12,
  },
});
```

### Tags vs Extra Data

This distinction matters for how you query Sentry later:

- **Tags** — Indexed, searchable, filterable. Use for categories you'll want to filter by: `type`, `model`, `environment`. Think of these as columns in a database.
- **Extra** — Attached context, not indexed. Use for details you'll read when investigating a specific event: `animationId`, `userId`, `creditsRefunded`. Think of these as a JSON blob attached to a row.

**Rule of thumb**: If you'd want to write `WHERE tag = 'value'`, make it a tag. If you'd want to read it in a single event's detail view, make it extra data.

### Severity Levels

Sentry events have levels that determine how they're prioritized:

| Level | When to Use | Example |
|-------|-------------|---------|
| `fatal` | App is completely broken | Database connection lost |
| `error` | An operation failed | Fal.ai returned FAILED |
| `warning` | Something concerning but handled | Animation timed out, credits refunded |
| `info` | Notable events worth tracking | (We don't use this yet) |
| `debug` | Development-only noise | (Never in production) |

## Our Instrumentation Strategy

We instrument at **failure boundaries** — the specific points where an operation can fail and a user is impacted:

| Event | Level | Tag | What It Means |
|-------|-------|-----|---------------|
| Animation times out (20 min) | `warning` | `animation_timeout` | Fal.ai job hung, credits auto-refunded |
| Fal.ai returns FAILED | `error` | `animation_fal_failure` | Fal.ai explicitly failed, credits refunded |
| `/api/animate/status` crashes | `error` | `animation_status_error` | Unexpected exception in status polling |
| `/api/animate` submission crashes | `error` | `animation_submit_error` | Failed to submit animation to Fal.ai |
| `/api/generate` image gen crashes | `error` | `generation_error` | Image generation (Gemini/DALL-E) failed |
| Any unhandled exception | `error` | (automatic) | Caught by Sentry SDK automatically |

### What We Don't Instrument

Not every `console.log` should become a Sentry event. Over-instrumenting creates noise that buries real problems. We skip:

- **Expected failures** — User submits an empty prompt (400 response). That's validation, not an error.
- **Auth redirects** — User isn't logged in. That's a flow, not a failure.
- **Successful operations** — Don't send "animation completed successfully" to Sentry. It's an error monitoring tool, not an analytics platform.

**The filter**: Would you want to be woken up at 3am for this? If no, don't send it to Sentry.

## Code Walkthrough

### SDK Configuration

We have three config files because Next.js runs code in three environments:

- `sentry.client.config.ts` — Runs in the browser. Captures React errors, failed fetches, etc.
- `sentry.server.config.ts` — Runs in Node.js (API routes, SSR). Captures server-side exceptions.
- `sentry.edge.config.ts` — Runs in edge middleware. Captures middleware errors.

All three share the same DSN (the project identifier) but can have different settings. We disable captures in development (`beforeSend` returns `null`) to avoid polluting production data with dev noise.

### The `beforeSend` Guard

```typescript
beforeSend(event) {
  if (process.env.NODE_ENV === "development") return null;
  return event;
}
```

This is critical. Without it, every error you hit while developing would show up in your Sentry dashboard, making it impossible to distinguish real production issues from local debugging.

### Wrapping next.config.js

```javascript
const { withSentryConfig } = require("@sentry/nextjs");
module.exports = withSentryConfig(nextConfig, { ... });
```

This wrapper does two things at build time:
1. **Injects instrumentation** into your Next.js webpack bundles
2. **Uploads source maps** to Sentry (when `SENTRY_AUTH_TOKEN` is set) so stack traces show your actual TypeScript code instead of minified JavaScript

### Sample Rate

```typescript
tracesSampleRate: 0.1, // 10% of requests get performance traces
```

Performance tracing adds overhead. At 100%, every request sends timing data to Sentry. At 10%, only a random 10% of requests are traced. This is fine for spotting patterns ("the /api/animate route is slow") without the cost of tracing everything.

Error capture is always 100% — you never want to miss an error.

## Mental Model: The Error Funnel

Think of errors in your app as a funnel:

```
All possible errors
    ↓ (automatic SDK capture)
Unhandled exceptions — Sentry catches these for free
    ↓ (manual instrumentation)
Handled failures — You explicitly capture these at failure boundaries
    ↓ (tags + extra data)
Structured events — Searchable, groupable, alertable
    ↓ (alerting rules)
Notifications — You find out when things break
    ↓ (investigation)
Resolution — You fix the root cause
```

The goal is to minimize the gap between "error happens" and "you know about it." With `console.log`, that gap can be infinite. With Sentry, it's minutes.

## Best Practices

1. **Tag consistently** — Use a `type` tag on every manual capture. This lets you filter your entire Sentry dashboard by failure category.
2. **Include IDs in extra data** — Always attach the relevant entity IDs (animationId, userId, generationId). These let you cross-reference with your database during investigation.
3. **Use levels correctly** — `warning` for handled situations (timeouts with refunds), `error` for actual failures. Don't use `error` for everything — it dilutes urgency.
4. **Don't capture expected failures** — Validation errors, auth redirects, and "not enough credits" are product flows, not monitoring events.
5. **Set up alerts early** — Sentry's default alerts notify you of new issues. Customize later, but the defaults are surprisingly good.
6. **Review weekly** — Spend 10 minutes a week looking at your Sentry dashboard. Patterns emerge: "Fal.ai fails more on Pro model" or "Timeouts spike on weekends."

## Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_SENTRY_DSN` | `.env.local` + Vercel | Project identifier — tells the SDK where to send events |
| `SENTRY_AUTH_TOKEN` | `.env.local` + Vercel | Build-time auth for source map uploads |

The DSN is safe to expose publicly (it's in client-side code). The auth token must stay secret (it has write access to your Sentry project).

## Further Reading

- [Sentry Next.js SDK Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/) — Official setup and API reference
- [Observability Engineering (O'Reilly)](https://www.oreilly.com/library/view/observability-engineering/9781492076438/) — Deep dive into the three pillars
- [Google SRE Book — Monitoring](https://sre.google/sre-book/monitoring-distributed-systems/) — How Google thinks about monitoring at scale
- [Charity Majors on Observability](https://charity.wtf/) — Blog by Honeycomb's CTO on modern observability philosophy
