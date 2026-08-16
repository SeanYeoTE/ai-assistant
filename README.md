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
on every push and PR. This is meant to be a required status check (see repo
settings below) so nothing merges to `main` without passing.

**CD** (`.github/workflows/eas-build.yml`, `eas-submit.yml`) — manual only
(`workflow_dispatch`), never triggered by a push:
- `development` / `preview` builds run immediately when dispatched.
- `production` builds and **all** submits run under the `production` GitHub
  Environment, which blocks the job until a required reviewer approves it in
  the Actions tab — see setup below. Submitting ships a build to the App
  Store/Play Store review queue, which is hard to reverse, so that step is
  never automatic.

Both workflows need an `EXPO_TOKEN` repo secret (an Expo access token with
build/submit permission — generate one at expo.dev/settings/access-tokens).

### Manual repo settings (do these once, in GitHub's web UI)

This session's GitHub tooling can't change repo/branch protection settings,
so these need to be set up by hand:

1. **Settings → Environments → New environment → `production`** → under
   "Deployment protection rules", add yourself as a required reviewer. This
   is what actually gates `eas build --profile production` and `eas submit`.
2. **Settings → Secrets and variables → Actions** → add `EXPO_TOKEN`, and
   `ANTHROPIC_API_KEY` if you want CI to exercise anything that calls Claude.
3. **Settings → Branches → Add branch protection rule** for `main`:
   - Require a pull request before merging
   - Require status checks to pass (select the `Lint & Typecheck` check
     from `ci.yml`) before merging
   - Optionally "Require review from Code Owners" to make `.github/CODEOWNERS`
     enforce your review on every PR

`.github/CODEOWNERS` and `.github/pull_request_template.md` are already in
place to support #3.
