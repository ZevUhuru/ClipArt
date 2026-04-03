# Engineering Study Guide

This directory contains deep-dive explanations of engineering decisions made in this codebase. Each document teaches a concept through the lens of a real problem we solved, explaining not just *what* we did but *why* — and what the alternatives were.

Use these to study software engineering patterns, tradeoffs, and mental models. They're written to be useful whether you're reviewing a specific change or learning a concept for the first time.

## Modules

| Module | Core Concept | Quick Summary |
|--------|-------------|---------------|
| [Data Fetching & Caching](./data-fetching-and-caching.md) | Where and when to fetch data in a web app | Client vs server fetching, caching layers, stale-while-revalidate |
| [Rendering Strategies](./rendering-strategies.md) | How pages get built and delivered | SSR, SSG, CSR, ISR — when to use each and why |
| [RLS & Auth Architecture](./rls-and-auth-architecture.md) | Why browser-side auth queries fail silently | Row Level Security, auth session timing, the server verification pattern |
| [AI-Assisted Prompt Engineering](./ai-assisted-prompt-engineering.md) | Using one AI to write prompts for another | Knowledge distillation, system prompts, vision-language models, the meta-prompting pattern |
| [Error Monitoring & Observability](./error-monitoring-and-observability.md) | Knowing when things break before users tell you | Sentry, structured error capture, tags vs extra data, the error funnel |

## How to Read These

Each module follows the same structure:

1. **The Problem** — What we were trying to solve
2. **The Concept** — The underlying engineering principle, explained from scratch
3. **The Options** — Every approach we could have taken, with honest tradeoffs
4. **What We Chose & Why** — The specific decision and reasoning
5. **Code Walkthrough** — The actual implementation, annotated
6. **Mental Model** — A framework you can reuse in other situations
7. **Further Reading** — Links to go deeper

## Philosophy

There is rarely a "correct" answer in software engineering. There are tradeoffs. The goal of these documents is to help you **see the tradeoff space** clearly so you can make informed decisions — not memorize rules.
