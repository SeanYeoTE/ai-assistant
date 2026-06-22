# Homework Success — Testing Checklist

Used by the tester agent and manual QA before every commit. Each item must be PASS before changes are merged.

---

## Automated checks (run by CI — `npm run lint && npm run build`)

| Check | Command | Expected |
|---|---|---|
| Lint | `npm run lint` | Zero errors, zero warnings |
| TypeScript | `npm run build` | No type errors |
| Build | `npm run build` | Produces `/api/parse`, `/api/chat`, `/api/upload` routes |

---

## API route: `POST /api/parse`

| # | Test | Expected |
|---|---|---|
| 1 | Send valid `{ imageBase64, studentNames, className }` | Returns `{ students: ParsedStudent[] }` with HTTP 200 |
| 2 | Send request with missing `imageBase64` | Returns `{ error: "..." }` with HTTP 400 |
| 3 | Send request with empty `studentNames` array | Returns `{ error: "..." }` with HTTP 400 |
| 4 | Anthropic API returns malformed JSON | Returns fallback: all students with `uncertain: true`, `homework: "NA"`, `sp: null`, `tx: null` |
| 5 | `ANTHROPIC_API_KEY` not set | Returns HTTP 500 with error message, does not crash the server |

---

## Template system

| # | Test | Expected |
|---|---|---|
| 6 | `DEFAULT_TEMPLATE` stored value | Contains `{{className}}`, `{{studentName}}`, `{{date}}`, `{{homework}}`, `{{sp}}`, `{{tx}}` literally — no rendered names like "Oliver" |
| 7 | `sampleToTemplate()` | Must NOT exist anywhere in `app/page.tsx` |
| 8 | `generateMessage()` with all fields | Output message has no remaining `{{...}}` tokens |
| 9 | `generateMessage()` with `sp: null` | `{{sp}}` replaced with `—`, not `null` or empty |
| 10 | Settings → Message → Reset | Template restored to `DEFAULT_TEMPLATE` |
| 11 | Settings → Message → Save custom template | Template persists after page reload |

---

## Onboarding flow

| # | Test | Expected |
|---|---|---|
| 12 | Fresh load (no `hws_onboarded` in localStorage) | Splash screen → Onboarding step 0 (Welcome) |
| 13 | Enter teacher name → Get Started | Advances to step 1 (Classes) |
| 14 | "Get Started" with empty name | Button is disabled / does not advance |
| 15 | Step 1: add class name → Next | Advances to step 2 (Students) |
| 16 | Step 1: Next with no class name | Button is disabled |
| 17 | Step 2: Finish Setup with students | Saves teacher name, classes, students; shows main app |
| 18 | Step 2: Skip setup link | Advances to main app with no classes; Upload tab shows empty state |
| 19 | Returning load (`hws_onboarded: true`) | Goes directly to main app, no onboarding |

---

## Upload & Generate flow (daily use path)

| # | Test | Expected |
|---|---|---|
| 20 | Upload tab with no classes | Empty state message: "No classes set up yet — go to Settings → Classes" |
| 21 | Class dropdown | Shows all classes from `hws_classes` |
| 22 | "Take Photo" button (mobile) | Triggers file input with `capture="environment"` |
| 23 | "Choose from Library" button | Triggers file input without `capture` attribute |
| 24 | Select a non-image file | No preview, `imageData` remains null, Parse button stays disabled |
| 25 | Select an image > 1400px wide | Preview shows; base64 payload is a resized JPEG, not the original full-res file |
| 26 | Select an image ≤ 1400px wide | Preview shows; base64 payload is JPEG of original dimensions |
| 27 | "Read & Parse Notes" with no image | Button is disabled |
| 28 | Successful parse | Step advances to Review (step 2); student cards rendered |
| 29 | Uncertain student in parse result | Card has yellow border; fields are visible |
| 30 | Non-uncertain student | Card has green border; fields are visible (not collapsed) |
| 31 | Edit a field on a student card | Updated value reflected in card |
| 32 | "Generate N Messages" | Step advances to Send (step 3); messages rendered; history saved to localStorage |
| 33 | "Copy" on one student | Correct message copied to clipboard; toast appears briefly |
| 34 | "Copy All" button | All messages joined with `---` separator; toast appears |
| 35 | "← New Upload" | Resets to step 1; image cleared |
| 36 | Network error during parse | Error banner shown; loading spinner stops; teacher can retry |
| 37 | API returns error body | Error banner shows the error string from the response |

---

## History tab

| # | Test | Expected |
|---|---|---|
| 38 | History tab before any generate | Students listed under "NO ENTRIES YET" |
| 39 | History tab after generate | Students with entries listed under "STUDENTS" with entry count and last date |
| 40 | Tap a student name | Drill-in view shows all entries newest-first |
| 41 | Entry card | Shows date, homework badge, SP value, TX value |
| 42 | Back button | Returns to class list view |
| 43 | Switch class selector | History updates for selected class |

---

## Settings tab

| # | Test | Expected |
|---|---|---|
| 44 | Settings → Message | Shows current template in preview card |
| 45 | Tap preview card | Enters edit mode; textarea pre-filled with current template |
| 46 | Edit textarea → Save | Template persists; "Saved!" confirmation shown; preview updates |
| 47 | Edit textarea → Cancel | Template unchanged |
| 48 | Reset while editing | Textarea resets to `DEFAULT_TEMPLATE` (not saved yet) |
| 49 | Settings → Classes | Lists all classes |
| 50 | Expand class → rename | Class name updates immediately |
| 51 | Expand class → add student | Student appears in list |
| 52 | Expand class → remove student | Student removed; Upload tab reflects change |
| 53 | Delete class | Class removed; History tab removes it from selector |
| 54 | Settings → Profile → edit name | Teacher name updates in localStorage |
| 55 | Settings → Profile → Reset App | Confirmation dialog; on confirm: localStorage cleared, page reloads to onboarding |

---

## Regression checks (run after any change to `app/page.tsx`)

| # | Test | Expected |
|---|---|---|
| 56 | `localStorage` keys after onboarding | `hws_onboarded`, `hws_teacher`, `hws_classes`, `hws_template`, `hws_history` all present |
| 57 | Reload mid-session | All state restored from localStorage; no data loss |
| 58 | Bottom nav tabs | All three tabs (Upload, History, Settings) switch correctly |
| 59 | Splash screen timing | Shows for ~1.8s, then reveals main app or onboarding |

---

## CI / automated notes for agents

- The build check (`npm run build`) runs TypeScript compiler and catches type errors. A passing build is a minimum bar.
- Lint (`npm run lint`) uses `eslint-config-next`. Zero errors required before commit. Warnings are acceptable only with an inline `// eslint-disable-next-line` comment explaining why.
- There are no Jest/Vitest unit tests yet. The manual checklist above substitutes until tests are added.
- When adding tests, follow Next.js 16 testing patterns — read `node_modules/next/dist/docs/` before writing test configuration.
