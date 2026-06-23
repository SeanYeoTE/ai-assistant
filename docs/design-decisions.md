# Homework Success — Design Decisions

## Project purpose and user

Teacher Yie Teng is a primary school teacher in Singapore who tracks student homework completion, spelling scores (SP), and Chinese spelling scores (TX / tingxie) in handwritten progress notes at the end of each teaching day. Before this app, she would manually type 12 or more individual WhatsApp messages — one per student — copying scores and comments from her handwritten sheet into each message. The messages follow a fixed format every time, so the actual writing work was mechanical transcription. This app eliminates that transcription step: she photographs her handwritten sheet, reviews the AI-parsed data, and copies ready-to-send messages with a single tap.

---

## Architecture diagram

```
Mobile browser (iOS Safari / Android Chrome)
        │
        │  1. Teacher selects or photographs progress sheet
        │
        ▼
app/page.tsx  (Next.js client component, "use client")
        │
        │  2. Canvas resize to max 1400px wide (client-side)
        │  3. Base64-encode resized image
        │
        │  POST /api/parse
        │  { imageBase64, classId, studentNames[] }
        │
        ▼
app/api/parse/route.ts  (Next.js API route, runs server-side)
        │
        │  4. Validate and pass to Anthropic SDK
        │
        │  Anthropic.messages.create(model: claude-sonnet-4-6,
        │    content: [{ type: "image", ... }, { type: "text", prompt }])
        │
        ▼
Anthropic Claude vision API (claude-sonnet-4-6)
        │
        │  5. Returns JSON array of student objects
        │
        ▼
app/api/parse/route.ts
        │
        │  6. JSON.parse() response, return to client
        │
        ▼
app/page.tsx
        │
        │  7. Render student review cards
        │  8. Teacher corrects any flagged (uncertain) entries
        │  9. "Generate Messages" → template rendering per student
        │  10. "Copy" → navigator.clipboard.writeText()
        │  11. saveHistory() → localStorage
        │
        ▼
Teacher pastes into WhatsApp
```

---

## Decision 1: Next.js over React Native

**Decision:** Build as a Next.js PWA instead of the React Native + Expo app originally proposed in the handover.

**Why:**
- `<input type="file" accept="image/*" capture="environment">` in HTML gives direct camera access on iOS Safari and Android Chrome without any native code.
- The teacher's full workflow — photograph sheet, review, copy to clipboard, paste into WhatsApp — requires no native device APIs beyond camera and clipboard, both of which are available in modern mobile browsers.
- The existing repository (`ai-assistant`) already had a working Next.js project with the Anthropic SDK integrated and a functioning API route pattern (`app/api/chat/route.ts`). Reusing this saves the full project scaffolding phase.
- A PWA installed to the home screen via "Add to Home Screen" provides an app-like launch experience (full-screen, no browser chrome) without requiring App Store submission.
- The alternative — Expo + EAS Build + TestFlight for iOS — would add 2–3 weeks of setup, requires an Apple Developer account ($99/year), and introduces build pipeline complexity, all for zero new user capability over the web approach.

**What we rejected:**
- React Native via Expo: Eliminated because the web input element covers the teacher's camera need, and Expo adds substantial distribution overhead for a single-user tool.
- Progressive enhancement with a native wrapper later: Remains available if the teacher reports limitations that genuinely require native APIs (e.g. background processing, push notifications). The architecture does not preclude wrapping the web app in a Capacitor or React Native WebView shell later.

---

## Decision 2: Backend proxy for the Anthropic API

**Decision:** All Claude API calls go through a Next.js API route (`app/api/parse/route.ts`), never directly from the browser.

**Why:**
- Direct browser-to-Anthropic requests fail with a CORS error. Anthropic does not set `Access-Control-Allow-Origin` headers for browser clients by design.
- The `ANTHROPIC_API_KEY` must never be sent to the browser. If it were in client-side code or environment variables prefixed `NEXT_PUBLIC_`, it would be readable by anyone who opened DevTools.
- The API route is also the correct place to handle image validation, size limits, and any retry logic without exposing those details to the client.
- The existing `app/api/chat/route.ts` already demonstrates the pattern: `import Anthropic from "@anthropic-ai/sdk"` on the server, `new Anthropic()` picks up `ANTHROPIC_API_KEY` from the server environment.

**What we rejected:**
- Direct client-side Anthropic calls: Not viable due to CORS and key exposure.
- A separate Express or Hono backend: Unnecessary complexity when Next.js API routes provide the same capability without a second process, a second deployment, and CORS configuration between them.

---

## Decision 3: localStorage over PostgreSQL

**Decision:** All persistence (classes, student lists, history, template, teacher name) is stored in `localStorage` under a set of `hws_*` keys. There is no database.

**Why:**
- This is a single-user tool for one teacher on one device. A database adds auth, schema migrations, connection management, hosting cost, and environment variables for zero benefit at this scale.
- The data volume is small: a class of 15 students with daily entries for a full school year is roughly 5,400 history records. That is well within localStorage's 5–10MB limit.
- `localStorage` is synchronous and has no latency — reads happen before first paint in the `useLocalStorage` hook initialiser.
- Supabase or Railway PostgreSQL would cost money (beyond the free tier) the moment multi-device sync or data export becomes relevant. That is the correct time to introduce a database.

**What we rejected:**
- PostgreSQL via Supabase: Appropriate if the tool ever needs to sync across the teacher's phone and desktop, or if multiple teachers share student records. The data model (see `functionality-spec.md`) is already normalised enough to map cleanly to SQL tables.
- IndexedDB: More capable than localStorage for larger datasets but significantly more complex API with no clear benefit at this data volume.
- SQLite (e.g. via Turso): Same tradeoff as PostgreSQL — adds infrastructure for a single-user scenario.

---

## Decision 4: Single-file component approach

**Decision:** All React components live in `app/page.tsx`. No component files are split out.

**Why:**
- The prototype was a 727-line single file and is fully readable as-is. Splitting into separate files would fragment context without improving the code.
- This is a single screen per tab with no shared component library requirements. There is no routing beyond the three bottom-nav tabs.
- For an MVP with one active developer, co-location of all component code reduces the cognitive overhead of jumping between files during iteration.

**What we rejected:**
- A `components/` directory: Appropriate when the component tree grows beyond what is readable in one file, or when components need to be shared across multiple pages. Revisit if the project adds a second route (e.g. a dedicated history export page).
- A design system or component library (e.g. shadcn/ui): Unnecessary for a single-user internal tool. The prototype's inline style objects are explicit and portable.

---

## Decision 5: Template system — store with `{{vars}}` directly

**Decision:** The message template is stored in `localStorage` as a string containing `{{vars}}` placeholders (e.g. `{{studentName}}`, `{{className}}`, `{{date}}`, `{{homework}}`, `{{sp}}`, `{{tx}}`). The Settings editor shows the template with placeholders visible. `generateMessage()` does `String.replace()` on each variable at render time.

**Why:**
- The prototype's `sampleToTemplate()` function worked by reverse-engineering placeholders from known sample values (e.g. replacing the literal string `"Oliver Update"` with `"{{studentName}} Update"`). This is fragile: if the teacher edited the sample message in a way that changed any of the known sample strings, `sampleToTemplate()` would silently produce a broken template.
- Storing `{{vars}}` directly means the template is always in its canonical form. There is no transformation that can silently fail.
- Teachers can read and understand `{{studentName}}` as a placeholder without technical explanation.

**What we rejected:**
- `sampleToTemplate()` as the production approach: The fragility risk is too high for a daily-use tool. One bad edit corrupts all future messages with no error.
- A WYSIWYG variable picker: More polish but unnecessary complexity for an MVP. The raw `{{var}}` strings are readable and editable in a plain textarea.

---

## Decision 6: Client-side image resize before upload

**Decision:** Before encoding a photo as base64 and sending it to `/api/parse`, the browser resizes it to a maximum of 1400px on the longest dimension using a `<canvas>` element.

**Why:**
- Camera photos from modern phones are 3–8MB at full resolution (12MP+). Sending these as base64 over a mobile connection adds 1–3 seconds of upload latency before Claude even starts processing.
- Anthropic's vision API has a per-image size limit. Resizing on the client guarantees the payload stays within bounds without needing server-side image processing.
- 1400px is sufficient for Claude to read handwriting clearly. Handwritten text does not benefit meaningfully from resolutions above this for OCR-style tasks.
- Canvas resize is a native browser API with no dependencies.

**What we rejected:**
- Sending full-resolution images: Too slow on mobile, risk of hitting API limits.
- Server-side resize (e.g. via Sharp): Adds a Node.js dependency and a processing step in the API route. The client already has the image; resizing it there is zero-latency additional overhead compared to a round trip.

---

## Decision 7: claude-sonnet-4-6 for vision parsing

**Decision:** Use `claude-sonnet-4-6` as the model for the parse API call.

**Why:**
- Handwriting recognition from photos is a difficult vision task. Haiku is faster and cheaper but makes more errors on ambiguous characters and uncommon names.
- The teacher's time saved per session — manually writing 12+ WhatsApp messages — easily justifies Sonnet pricing. Even at 100 API calls per month, the cost difference between Haiku and Sonnet is a few dollars.
- The structured JSON output requirement (see Prompt Engineering below) benefits from a more capable model that is less likely to add explanatory prose or malformed JSON around the output.

**What we rejected:**
- claude-haiku-4-5: Appropriate if cost becomes a concern after real-world volume measurement. Benchmark against Sonnet on a sample of the teacher's actual handwriting before switching.
- claude-opus: No meaningful accuracy improvement for handwriting tasks at substantially higher cost.

---

## Decision 8: Smart class creation from first upload

**Decision:** When a teacher has no classes set up and uploads their first image, the app sends the image to `/api/parse` with `studentNames: []`, then instead of navigating to Review it presents an inline "Create Class" step with the names Claude detected from the image pre-filled as the student list.

**Why:**
- Eliminates the manual data-entry bootstrap problem. The teacher cannot use the core parse feature without a class, but creating a class requires knowing all the student names — a chicken-and-egg problem that causes drop-off.
- Claude vision already reads the student names off the handwritten sheet, so those names are the natural starting point for the class's student list. No information is duplicated; the parse step bootstraps the class.
- Consistent with the core design principle: get the teacher to their first generated message as fast as possible. The inline class creation step sits directly in the upload flow rather than routing the teacher away to Settings.

**What we rejected:**
- Keeping the blocking empty state (prompting the teacher to go to Settings → Classes first): Forces manual data entry before the teacher can try the product; high drop-off risk.
- Pre-creating a placeholder class automatically: Creates empty or incorrect data in localStorage with no teacher input; subsequent parse calls would have no student list to ground against.
- Requiring onboarding to be completed (with student names) before allowing upload: The onboarding skip option exists precisely to let the teacher enter the app without full setup; reversing that decision for the upload tab is inconsistent and causes drop-off.

---

## LLM integration patterns

### System prompt design

The system prompt serves two purposes: it instructs the model on output format, and it grounds the model against hallucination using a known student list.

```
You are helping convert handwritten student progress notes into structured data.

Known student list for verification:
- Arissa
- Jerome
...

Rules:
- Read the handwriting carefully and prioritise matching names from the known student list.
- Do NOT hallucinate names, scores, or comments.
- If something is unclear, mark it as [unclear] instead of guessing.
- Preserve scores, units, comments, and homework exactly as written.
- If homework is blank, use "NA".
- "SP" refers to spelling. "TX" refers to tingxie / Chinese spelling.
- Chinese text like 第九课 or 练习 should remain in Chinese.
- Do not invent missing information.

Return ONLY valid JSON. No explanation, no markdown, no backticks.
Return an array of student objects: [...]
```

The list of known students (loaded dynamically from `localStorage` for the selected class) is the most important grounding mechanism in the prompt. Without it, Claude might misread "Bryan" as "Ryan" or invent a student name from ambiguous handwriting. With the list, it matches what it sees to the nearest known name, which is almost always correct because the teacher's notation does not contain names outside her class list.

### Structured JSON output

Claude is instructed to return a JSON array and nothing else. The response is fed directly into `JSON.parse()`. Two prompt clauses make this reliable:

1. `"Return ONLY valid JSON. No explanation, no markdown, no backticks."` — LLMs frequently wrap JSON output in triple-backtick code fences (` ```json ... ``` `). `JSON.parse()` throws a `SyntaxError` on that input. The "no backticks" instruction suppresses this behaviour.

2. The return schema is specified inline in the prompt with an example object. Providing the exact shape reduces the chance of Claude inventing extra keys or changing field names.

### Uncertainty flagging

Each student object in the response includes `"uncertain": true | false`. The model is instructed to set this to `true` if it was unsure about any value in that student's entry, or if the student's name did not exactly match the known list. In the UI, `uncertain: true` cards render with a yellow border and a warning label, and they default to expanded so the teacher immediately sees which entries need human review. All other cards are collapsed by default.

This pattern lets the AI communicate its own confidence without requiring a separate confidence-score field or probabilistic reasoning from the client code. It is binary and actionable: yellow = check this.

---

## Prompt engineering notes

**"Return ONLY valid JSON, no markdown, no backticks"**

Without this instruction, Claude (and most LLMs) will often produce:

```
Here are the parsed student records:

```json
[
  { "name": "Oliver", ... }
]
```
```

`JSON.parse()` called on that string throws `SyntaxError: Unexpected token H in JSON at position 0`. The "ONLY" and "no backticks" phrasing is directly aimed at this failure mode. It is worth being explicit rather than relying on the schema example alone.

**"If something is unclear, mark it as [unclear]"**

Instructing the model to use a sentinel string (`[unclear]`) rather than guess means the application code can detect uncertainty deterministically: `if (field.includes("[unclear]")) setUncertain(true)`. The alternative — asking Claude to omit unclear fields — creates ambiguity between "field not present" and "field absent from the handwritten sheet."

**Known student list grounding**

The student list passed to the system prompt is dynamic at runtime — it is pulled from the `students` array of the selected class in `localStorage`. The handover noted a hardcoded list of names from one specific class; in production the prompt builder must substitute the actual class's student list. This prevents names from one class appearing in another class's parsed output.

---

## Data flow: image to clipboard

1. **File selection** — `<input type="file" accept="image/*" capture="environment">` triggers the device camera picker on mobile or a file browser on desktop. The `onChange` handler receives a `File` object.

2. **Canvas resize** — The `File` is drawn to a hidden `<canvas>` element and redrawn at max 1400px wide preserving aspect ratio. `canvas.toDataURL("image/jpeg", 0.85)` produces a base64 data URL.

3. **Strip data URL prefix** — `dataUrl.split(",")[1]` extracts the raw base64 string (removing `data:image/jpeg;base64,`). This is the `imageBase64` field sent to the API.

4. **POST /api/parse** — The client sends `{ imageBase64, classId }`. The API route reconstructs the student list from the class record (stored in a request body field or resolved server-side from a class store). It builds the system prompt with the student list and calls `anthropic.messages.create()`.

5. **Claude vision call** — The message content array contains two items: an `image` block (`{ type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageBase64 } }`) and a `text` block with the parsing instruction. Claude returns text content.

6. **JSON.parse** — The API route calls `JSON.parse(responseText)` and returns `{ students: [...] }` to the client. If `JSON.parse` throws, the route returns `{ error: "parse_failed", raw: responseText }`.

7. **Student review cards** — `app/page.tsx` renders one `StudentCard` component per entry. Cards with `uncertain: true` are expanded and bordered yellow. The teacher can edit any field inline.

8. **Template rendering** — `generateMessage(student, className, date, template)` calls `String.replace()` for each `{{var}}` in the stored template string. This runs entirely in the browser; no network call.

9. **Clipboard write** — `navigator.clipboard.writeText(message)` copies one message (per-student "Copy" button) or all messages joined by `\n\n---\n\n` ("Copy All" button). On success, button text changes temporarily to "Copied". A toast notification should be added per the P1 UX fix list.

10. **History save** — `saveHistory(classId, entry)` merges the current session's student data into the `hws_history` key in `localStorage`, keyed by `classId → studentName → HistoryEntry[]`.

---

## Future decisions to make

### When to add a database

Add a database when any of these conditions is true:
- The teacher wants to access history from a second device (phone at school, desktop at home).
- A second teacher joins and needs their own data isolated from Teacher Yie Teng's.
- The teacher wants to export a term's worth of data to a spreadsheet or report.
- The `hws_history` localStorage key exceeds 2MB (observable via `localStorage.getItem("hws_history").length`).

The data model maps directly to three SQL tables: `classes`, `students` (FK to class), `history_entries` (FK to student). See `functionality-spec.md` for the TypeScript interface definitions.

### When to consider a native app

Consider a React Native port if:
- The teacher reports that the camera quality in the browser is worse than in the native camera app (some Android vendors apply additional post-processing in the camera app that is not available via browser media capture).
- Offline support becomes critical (the Anthropic API call requires internet; a native app could cache images and retry).
- Push notifications are needed (e.g. reminding the teacher to log progress at end of day).

The web-first approach does not prevent a native wrapper. The API route is already a stable backend contract; a React Native app would call the same `POST /api/parse` endpoint.

### When to add authentication

Add auth when there is more than one user or when the data is sensitive enough to warrant protecting beyond device-level security. Currently `localStorage` data is accessible to anyone who unlocks the teacher's phone, which is an acceptable risk for homework progress notes.

If auth is added, Supabase Auth (email/password or magic link) is the lowest-overhead option given the likely simultaneous addition of Supabase PostgreSQL for the database.
