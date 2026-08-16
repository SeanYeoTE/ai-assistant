# A.M.P

A voice-driven personal companion app — gym tracking, reminders, skincare,
supplement/medication logging, and personal-growth tools, all controllable by
natural voice conversation, with every feature also usable through a manual
tap-based UI. Full architecture brief: [`docs/AMP_HANDOVER.md`](docs/AMP_HANDOVER.md).

## Stack

- **Expo (React Native) + TypeScript**, file-based routing via `expo-router`
- **Anthropic Claude** (tool-use) for the voice command pipeline
- **AsyncStorage** for local persistence (per-domain, modular schemas)
- Design system: "Command Deck" (`src/design-system/`)

## Getting started

```bash
npm install
```

Create `.env.local`:
```
EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...
```

```bash
npm run start   # then press i / a / w, or scan the QR code with Expo Go
```

> The Anthropic key is currently called directly from the client for
> development convenience. Before distributing a build, proxy it through a
> small backend so the key isn't embedded in the app binary.

## Project structure

```
src/
  app/                    # expo-router screens
    (tabs)/               # Home, Today, Voice, Growth
  design-system/          # Command Deck tokens + shared components
  domains/
    growth/                # journaling + habit tracking (first domain built)
      types.ts             # data shapes
      storage.ts            # AsyncStorage read/write
      actions.ts             # the ONLY functions that touch this domain's data
      tools.ts                # Anthropic tool defs + executors wrapping actions.ts
  voice/
    claudeClient.ts        # calls Claude with the combined tool registry
    pipeline.ts             # transcript -> tool_use -> confirm -> execute -> speak
    registry.ts              # aggregates tool defs/executors across domains
docs/
  AMP_HANDOVER.md          # full product/architecture brief
```

Manual UI and voice both call the same `actions.ts` functions per domain —
see `AGENTS.md` for the rules this project is built around.

## Status

Foundation + Personal Growth domain (per the handover's suggested build
order). Next up: Reminders/Scheduling, Fitness (wrapping the existing gym
app), Skincare, then Medication/Supplements.

## CI

GitHub Actions runs `npm run lint && npm run typecheck` on every push. See
`.github/workflows/ci.yml`.
