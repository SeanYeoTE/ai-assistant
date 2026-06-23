# Homework Success

A Next.js web app for a primary school teacher to photograph handwritten student progress sheets and instantly generate copy-pasteable WhatsApp parent messages using the Claude vision API.

## What it does

1. Teacher photographs their handwritten progress sheet
2. Claude (via `/api/parse`) reads the handwriting and extracts per-student scores
3. Teacher reviews and corrects any flagged entries
4. One tap copies ready-to-send messages for all parents

## Stack

- **Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS**
- **Anthropic Claude** (`claude-sonnet-4-6`) for vision-based handwriting parsing
- **localStorage** for persistence (no database)

## Getting started locally

```bash
npm install
```

Create `.env.local`:
```
ANTHROPIC_API_KEY=sk-ant-...
```

```bash
npm run dev
# http://localhost:3000
```

## Project structure

```
app/
  page.tsx          # Full client app (Homework Success UI)
  layout.tsx        # Root layout
  api/
    parse/route.ts  # POST — Claude vision parsing endpoint
    chat/route.ts   # POST — General chat (starter, unused by HWS)
    upload/route.ts # POST — PDF text extraction (starter, unused by HWS)
docs/
  design-decisions.md   # Architecture decisions and LLM integration patterns
  functionality-spec.md # Feature inventory, state map, API contracts
  testing-checklist.md  # Manual QA checklist (59 items)
.github/workflows/
  ci.yml            # Lint + build on every push
```

## Docs

- [`docs/design-decisions.md`](docs/design-decisions.md) — why Next.js over React Native, why localStorage, how the Claude prompt works, full data flow
- [`docs/functionality-spec.md`](docs/functionality-spec.md) — component tree, state inventory, API contracts, data model, TODO list
- [`docs/testing-checklist.md`](docs/testing-checklist.md) — QA checklist for manual testing and CI

## Deployment

Deployed on Vercel. Set `ANTHROPIC_API_KEY` as an environment variable in the Vercel dashboard.

## CI

GitHub Actions runs `npm run lint && npm run build` on every push. See `.github/workflows/ci.yml`.
