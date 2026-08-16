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

## CI/CD and approvals

**CI** (`.github/workflows/ci.yml`) — runs `npm run lint && npm run typecheck`
on every push and PR.

**CD** (`.github/workflows/eas-build.yml`) — manual only
(`workflow_dispatch`), never triggered by a push. Currently **dev-only**:
`development` and `preview` build profiles, dispatched by hand, no approval
gate. Needs an `EXPO_TOKEN` repo secret (Settings → Secrets and variables →
Actions → generate one at expo.dev/settings/access-tokens).

**Production build/submit and the human-approval gate are intentionally not
set up yet.** The plan (deferred until GitHub web UI access is available):
- Create a `production` GitHub Environment (Settings → Environments) with
  yourself as a required reviewer — that's what would block an
  `eas build --profile production` or `eas submit` job until approved in the
  Actions tab, since submitting ships to the App Store/Play Store review
  queue and is hard to reverse.
- Branch protection on `main` (Settings → Branches): require a PR, require
  the `ci.yml` status check to pass, optionally require CODEOWNERS review.
  `.github/CODEOWNERS` and `.github/pull_request_template.md` are already in
  place to support this once enabled.

Ping me when you have GitHub UI access again and I'll add the `production`
build profile back to `eas.json` and re-add the gated build/submit
workflows.
