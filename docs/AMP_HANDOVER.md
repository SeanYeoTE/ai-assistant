# A.M.P — Handover Document

**Project:** A.M.P (working name) — a voice-driven personal companion app that merges an existing gym-tracking app with daily reminders, scheduling, healthcare tracking, skincare tracking, and personal growth tools, all controllable via natural voice conversation.

**Owner:** Sean
**Status:** Pre-implementation / architecture defined, no code written yet
**Platform decision:** Expo (React Native) — chosen specifically to avoid a Mac/Xcode requirement while still getting native capabilities (real background notifications, real mic access) that a browser-based PWA cannot reliably provide on iOS.

---

## 1. Product Concept

A.M.P absorbs an existing gym app and layers a voice assistant on top that can both **converse** and **take real actions inside the app** — logging workouts, editing entries, creating reminders, tracking skincare/health routines, and supporting general personal-growth journaling/habit tracking. Voice is the primary input method, not a bolt-on chat widget.

Core interaction loop: user speaks → speech is transcribed → LLM decides which action(s) to take across one or more domains → app executes those actions on real data → user gets a spoken confirmation.

**Voice is the primary input method, but not the only one.** Every feature must remain fully usable through standard manual UI (taps, forms, buttons, lists) with no voice interaction required. Voice is an accelerator on top of the app, not a gate in front of it. This matters for a few concrete reasons:
- Voice input isn't always practical (quiet environments, gym floor with music, mic access denied)
- STT/LLM calls introduce latency and cost — trivial actions (checking today's reminders, marking a habit done) should have a fast manual path
- Confirmation steps and edits should be reviewable/editable through the UI even when they originated from a voice command

**Implication for implementation:** build each domain's manual UI (screens, forms, lists) as the primary interface, and treat voice as an additional input method that calls the *same* underlying app functions/tools as the manual UI — not a separate parallel system. Both paths should read and write the same data through the same functions.

---

## 2. Domains (feature areas)

Each domain should be implemented as an isolated module with its own data schema and its own small set of LLM tool definitions (roughly 3–8 tools per domain). A single voice utterance may trigger tools across multiple domains in one turn (e.g. "log my squats and remind me to stretch tomorrow" → fitness tool + reminder tool in the same response).

| Domain | Example actions | Notes |
|---|---|---|
| **Fitness** (existing gym app) | Log a set/workout, adjust a routine, query progress trends | Reuse/wrap existing gym app logic as tools rather than rebuilding |
| **Reminders / Scheduling** | Create/edit/cancel a reminder or recurring task | Backed by `expo-notifications`, scheduled independently of any live voice session |
| **Medication/Supplements** | Log a supplement or medication taken (name, dose, time) | Simple logging only — no symptom tracking, no appointment scheduling, no diagnosis. See §6 Safety. |
| **Skincare** | Log routine step, log product used, time-of-day reminders | Similar shape to reminders but with its own history/schema |
| **Personal growth** | Journaling, habit streak tracking, goal tracking | Lowest-risk domain, good place to start building |

---

## 3. Voice Pipeline Architecture

```
Mic input (expo-av)
   → Speech-to-Text (streaming preferred; e.g. Deepgram/cloud STT, or device STT)
   → Text sent to LLM (Claude) WITH current relevant app-state context + tool definitions
   → LLM returns tool_use block(s)
   → App code executes the actual read/write against local data (LLM never touches DB directly)
   → Result returned to LLM → LLM produces confirmation text
   → Text-to-Speech (expo-speech for on-device, or cloud TTS like ElevenLabs for higher quality)
   → Playback to user
```

**Key architectural rules carried over from prior discussion:**
- LLM calls are stateless — full relevant conversation + state must be re-sent each turn (messages array).
- Tools are the only way the LLM affects app data. It requests an action; app code executes it.
- Inject only a **relevant slice** of app state per turn (current screen/record/recent items), not the entire user profile — keeps context small and cheap.
- **Any edit-type action should have a confirmation step** before it's applied — spoken confirmation ("Did you mean update Bryan's SP to 8?") or a visual diff the user approves. Voice input is error-prone (misheard names/values), so silent auto-apply is risky, especially for healthcare logging.
- Multi-tool turns need graceful confirmation UX: bundle confirmations when one utterance triggers multiple actions.

**Example tool definition shape (Anthropic tool-use format):**
```json
{
  "name": "log_workout_set",
  "description": "Log a completed set for a given exercise",
  "input_schema": {
    "type": "object",
    "properties": {
      "exercise": { "type": "string" },
      "reps": { "type": "integer" },
      "weight": { "type": "number" },
      "unit": { "type": "string", "enum": ["kg", "lb"] }
    },
    "required": ["exercise", "reps"]
  }
}
```

---

## 4. Data Model

Single unified user profile with **modular sub-schemas** per domain (fitness, reminders, healthcare, skincare, growth) rather than fully separate databases — this matters because voice queries often cross domains ("how am I doing overall this week") and disconnected stores make that hard to answer well.

---

## 5. Platform & Deployment Decisions (with reasoning)

- **No Mac available** → Xcode is Mac-only (not available on Windows; Hackintosh/VM routes are unstable and/or against Apple's EULA — not recommended).
- **Decision: Expo (React Native)**, not native Swift, not a browser PWA.
  - Expo compiles to a real native binary via **EAS Build**, which builds the iOS binary in Apple's cloud — no local Mac needed.
  - This is *not* a webapp — despite using React, it is not subject to iOS Safari's web-push and background-execution limitations (which are a genuine dealbreaker for the Reminders/Scheduling domain specifically).
- **Apple account:** a **free Apple ID is sufficient to start.**
  - Free tier supports local notifications (`expo-notifications`) — covers the reminder/scheduling domain without any paid account.
  - Free tier does **not** support remote push notifications, TestFlight, or full HealthKit background access.
  - Free-tier signed builds (whether via raw Xcode or EAS internal distribution) have a limited validity window (~7 days) before requiring reinstall.
  - **Recommendation:** stay on free tier for now; revisit the $99/year Apple Developer Program only if/when TestFlight, push notifications, or deeper HealthKit access become necessary. Not needed for MVP or for daily personal use.
- **Build stability workaround (avoiding manual reinstall every ~6 days):**
  - Automate periodic rebuild/reinstall using `eas build` on a schedule (e.g. GitHub Actions cron, or any always-on low-power machine) rather than requiring a Mac to stay awake.
  - This was scoped as a follow-up task, not yet implemented — see Open Items.

### Initial setup commands
```bash
npm install -g eas-cli
npx create-expo-app amp-app
cd amp-app
npx expo install expo-notifications expo-av expo-speech
eas login
eas build:configure
eas build --platform ios --profile development
```

---

## 6. Safety / Guardrails

- **Medication/Supplements domain is a simple log only** — name, dose, and time taken. No symptom tracking, no appointment scheduling, no diagnosis, and no medication-change recommendations. The assistant should only record what the user reports and can remind them to take something, but should never suggest dosages, interactions, or treatment decisions.
- Consider whether medication/supplement data needs any extra privacy handling depending on jurisdiction and distribution scope (personal use only vs. eventually shared/public) — encrypt at rest at minimum, and avoid letting any third-party LLM provider log this data if avoidable.
- All destructive or data-editing voice actions require a confirmation step before being applied.

---

## 7. Suggested Build Order

1. **Personal growth domain first** (journaling/habit tracking) — lowest risk, good place to validate the voice pipeline end-to-end (STT → tool call → confirm → execute → TTS) before touching real gym/health data. Build its manual UI (form/list) first, then wire voice to call the same underlying functions — confirms the "same functions, two input paths" pattern early.
2. **Reminders/Scheduling** — validates `expo-notifications` and background firing independent of an open app session.
3. **Fitness domain** — wrap/integrate the existing gym app's data and actions as tools.
4. **Skincare** — structurally similar to reminders + a logging domain, should be quick once #2 and #3 patterns exist.
5. **Medication/Supplements** — simple log, build last purely because it's lowest priority, not because it's complex (see §6).

---

## 9. Visual Design System (Finalized: "Command Deck")

A full interactive design reference (`AMP_design_system_and_mockups.html`) was produced covering shared spacing/type/component tokens plus 4 exploratory visual directions. **"Command Deck" was selected as the final direction.** Its tokens below are canonical — implement against these rather than re-deriving a palette.

### Rationale
Graphite surfaces with a cyan signal accent and monospace data readouts. Reinforces the "life OS" concept — many domains (fitness, reminders, skincare, meds, growth) reporting into one dashboard — with a precise, technical feel rather than a purely decorative skin.

### Typography
- **Display/Headings:** Space Grotesk (weights 500/600/700)
- **Body:** Work Sans (weights 400/500/600)
- **Data/timestamps/mono readouts:** IBM Plex Mono (400/500)

### Type scale
| Role | Size/Line-height | Weight |
|---|---|---|
| Display | 34/40 | 700 |
| H1 | 24/30 | 700 |
| H2 | 19/24 | 600 |
| Body Large | 17/24 | 500 |
| Body | 15/21 | 400 |
| Caption | 13/18 | 400 |
| Micro (uppercase, tracked) | 11/14 | 600 |

### Color tokens
| Role | Hex |
|---|---|
| Background | `#14171C` |
| Surface | `#1D2128` |
| Surface Elevated | `#262B33` |
| Text Primary | `#F3F5F7` |
| Text Secondary | `#8B94A3` |
| Accent Primary (voice FAB, primary actions) | `#4FD1C5` |
| Domain — Fitness | `#F2A93B` |
| Domain — Reminders | `#4FD1C5` |
| Domain — Skincare | `#E8779E` |
| Domain — Growth | `#9B8CFF` |
| Domain — Meds/Supplements | `#6FCF7A` |
| Success | `#6FCF7A` |

### Spacing scale (4px base grid)
`4 / 8 / 12 / 16 / 24 / 32 / 48px`

### Radius scale
`sm 8px · md 14px · lg 22px · pill 999px`

### Elevation
Three levels — subtle (`0 1px 2px rgba(0,0,0,.06)`), card (`0 4px 10px rgba(0,0,0,.08)`), modal/FAB (`0 12px 28px rgba(0,0,0,.14)`).

### Core components
- **Buttons:** primary (filled pill, `#17181A`-on-dark equivalent uses accent fill), secondary (outline pill), ghost (underlined text), icon button (44px circular tap target), **Voice FAB** (64px circular, accent-filled, signature element — appears identically on every screen where voice can be invoked)
- **Domain chip:** colored dot + label, used for tagging items by domain
- **List row:** leading icon in rounded-square container + title/subtitle + trailing control (checkbox, chevron, or toggle)
- **Confirmation sheet:** bottom sheet pattern for voice-originated multi-action confirmations — shown as parsed action(s) with Edit/Confirm buttons (ties directly to the confirmation-step requirement in §3/§6)
- **Voice orb:** pulsing concentric rings around a filled mic icon, used on the dedicated voice-interaction screen

### Reference screens included in the HTML file
Home/Dashboard, Voice interaction (listening + confirmation), Today (cross-domain list with manual add path) — all built to demonstrate the manual-UI-parity requirement from §1: every voice action shown has an equivalent tap-based path.

---

## 10. Open Items / Not Yet Decided

- [ ] Exact STT/TTS providers (on-device via `expo-speech` vs. cloud providers like Deepgram/ElevenLabs for quality) — cost/latency/quality tradeoff not yet evaluated.
- [ ] Automated rebuild/reinstall scheduling (GitHub Actions + `eas build` on cron) — concept agreed, not implemented.
- [ ] Confirmation UX pattern for multi-tool turns (spoken vs. visual diff) — not yet designed.
- [ ] Whether/when to move to the paid Apple Developer Program (revisit if TestFlight/push/HealthKit needed).
- [ ] Full data schema per domain — only conceptually modular so far, not field-level defined.
- [ ] Integration approach for the existing gym app's codebase into the new Expo project (rewrite vs. wrap existing logic as tools).

---

*This document reflects architectural decisions made through conversational planning. No code has been implemented yet — this is the brief for an implementation agent to begin from. Ship this file together with `AMP_design_system_and_mockups.html` (open the "Command Deck" tab for the finalized visual reference).*
