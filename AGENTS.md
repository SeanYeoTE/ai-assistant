# A.M.P — Agent Notes

Voice-driven personal companion app (Expo / React Native + TypeScript). Full
architecture brief: `docs/AMP_HANDOVER.md`. Design tokens:
`src/design-system/tokens.ts`, implementing the "Command Deck" system.

## Rules that matter more than usual here

- **Every domain function has exactly one implementation**, in
  `src/domains/<domain>/actions.ts`. The manual UI (`src/app/**`) and the
  voice tool executor (`src/voice/registry.ts`) both call these same
  functions — never duplicate read/write logic between them.
- **Voice is additive, not required.** Any feature built for voice needs a
  working manual UI path (list/form/button) that does the same thing.
- **The LLM never touches storage directly.** It only returns `tool_use`
  blocks; app code executes them. See `src/voice/pipeline.ts`.
- **Edit-type voice actions require confirmation** before they're applied —
  route them through `ConfirmationSheet` (`src/design-system/ConfirmationSheet.tsx`).
- Don't re-derive the color palette or type scale — use the tokens in
  `src/design-system/tokens.ts` as-is.

## Adding a new domain

1. `src/domains/<name>/types.ts`, `storage.ts` (AsyncStorage), `actions.ts`
   (the plain functions), `tools.ts` (Anthropic tool defs + executors).
2. Register the domain's tools in `src/voice/registry.ts`.
3. Add manual UI screens under `src/app/(tabs)/`.
4. Add a `DomainKey`/color entry in `src/design-system/tokens.ts` if the
   domain doesn't already have one from Command Deck's canonical palette.
