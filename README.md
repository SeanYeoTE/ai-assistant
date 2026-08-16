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
    (tabs)/               # Home, Today, Voice, Fitness, Growth, Reminders, Skincare
  design-system/          # Command Deck tokens + shared components
  domains/
    growth/                # journaling + habit tracking (first domain built)
      types.ts             # data shapes
      storage.ts            # AsyncStorage read/write
      actions.ts             # the ONLY functions that touch this domain's data
      tools.ts                # Anthropic tool defs + executors wrapping actions.ts
    reminders/              # local notifications, one-off or recurring
      types.ts, storage.ts, actions.ts, tools.ts   # same shape as growth/
      notifications.ts       # expo-notifications wrapper (schedule/cancel)
    fitness/                # split/exercise/set logging + streaks
      types.ts, storage.ts, actions.ts, tools.ts   # same shape as growth/
      streak.ts              # grace-day streak math, ported from Gymm
    skincare/                # routine steps, products, time-of-day reminders
      types.ts, storage.ts, actions.ts, tools.ts   # same shape as growth/
      notifications.ts       # expo-notifications wrapper for the morning/evening reminders
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

Foundation + Personal Growth + Reminders/Scheduling + Fitness + Skincare
domains (per the handover's suggested build order). Next up:
Medication/Supplements — the last one.

Reminders' manual "add" form uses quick date/time presets (In 1 hour, Today
6pm, Tomorrow 9am) rather than a native date picker — that's a deliberate
scope cut to avoid pulling in another native module before the app has been
run on a device; swap in `@react-native-community/datetimepicker` when a
real picker is needed.

### Fitness domain: what got reused from Gymm, what didn't

Per the handover's instruction to "reuse/wrap existing gym app logic as
tools rather than rebuilding," this domain is ported from
[`SeanYeoTE/Gymm`](https://github.com/SeanYeoTE/Gymm) (`app/lib/data/`):

- **Reused as-is:** the `Split`/`LiftSet`/`LoggedExercise` data shapes, the
  set-split/add-exercise/save-lift write semantics (switching splits clears
  that day's exercises, `addExercise` dedupes by name, `saveLift` replaces
  a set list wholesale), the exercise suggestion list per split, and —
  faithfully ported — Gymm's grace-day streak algorithm (`compute_streak()`
  in its Postgres migrations), including the "protected rest day" rule.
  `src/domains/fitness/streak.ts` documents the port and was sanity-checked
  against a handful of hand-computed cases (consecutive days, protected
  rest, grace-bank consumption, streak-breaking gaps).
- **Not reused:** Gymm's Supabase backend and auth. It requires a signed-in
  user (`supabaseProvider.ts`'s `requireUserId()`), and A.M.P has no auth
  or backend set up — every other domain here is local-only
  (`AsyncStorage`), so Fitness follows the same pattern for now rather than
  introducing the only authenticated domain in the app. This also means
  Gymm's social features (friends, presence, outlets, high-fives) are
  out of scope — they're not in the handover's Fitness domain description
  either.
- If/when A.M.P grows real accounts, swapping Fitness's `actions.ts` to call
  Gymm's actual `supabaseProvider` (or a shared backend) instead of
  AsyncStorage is a contained change — `types.ts` already matches its
  shape closely.

### Skincare's reminders are separate from the Reminders domain

Skincare schedules its own morning/evening `expo-notifications` (one daily
trigger per time-of-day, in `src/domains/skincare/notifications.ts`) rather
than calling into `src/domains/reminders/`. The handover's domain table
describes Skincare as "similar shape to reminders but with its own
history/schema" — these are routine-level reminders tied 1:1 to a
morning/evening bucket, not user-created one-off/recurring items, so they
don't fit the general Reminders domain's data model. Both wrappers are thin
enough (permission check + schedule/cancel) that duplicating the ~10 lines
was simpler than introducing a cross-domain dependency.

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
