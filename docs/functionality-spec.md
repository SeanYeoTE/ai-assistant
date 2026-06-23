# Homework Success — Functionality Specification

This document is the authoritative reference for what the app does, how it is structured, and what every piece of moving state controls. It is written for a developer or AI agent picking up the project cold.

---

## Feature inventory

| Feature | Description |
|---|---|
| Splash screen | 1.8s animated loading screen shown on first paint before localStorage is read |
| 3-step onboarding | Wizard (Name → Classes → Students) shown once when `hws_onboarded` is `false` in localStorage |
| Onboarding skip | Student step can be completed with zero students; students can be added later in Settings |
| Upload tab | File/camera input, class and date selectors, parse trigger, student review cards, generate messages, copy-per-student and copy-all |
| Client-side image resize | Canvas resize to max 1400px before base64 encoding; reduces payload size and API latency |
| AI parse via backend proxy | POST to `/api/parse` sends image and class context; returns structured JSON from Claude vision API |
| Uncertain-entry flagging | Cards where `uncertain: true` render yellow-bordered and expanded for immediate teacher review |
| Inline field editing | Each student card has editable inputs for Homework, SP, and TX; teacher can correct AI output before generating |
| Message generation | `generateMessage()` renders one WhatsApp message per student by substituting `{{vars}}` in the stored template |
| Copy individual message | Per-student "Copy" button; button text changes to "Copied" for 2s on success |
| Copy all messages | "Copy All" button joins all messages with `\n\n---\n\n` separator; same success feedback |
| History save | On "Generate Messages", current session's student data is appended to `hws_history` in localStorage |
| History tab | Class selector, student list with entry count and last date, drill-in to per-student entry list |
| History entry display | Each entry shows date, homework, SP score, TX score in card layout; entries shown newest-first |
| Settings — Message | Textarea editor for the message template (raw `{{vars}}` visible); Reset button restores default; Save persists to localStorage |
| Settings — Classes | Accordion list of classes; expand to rename class or manage students; add/remove students inline; delete class |
| Settings — Profile | Edit teacher name; hard reset (clears all localStorage and reloads) |
| Bottom navigation | Fixed three-tab nav: Upload, History, Settings |
| PWA install | `<meta>` tags and manifest enable "Add to Home Screen" on iOS and Android for app-like launch |
| Smart class creation from upload | When no classes exist, first parse response pre-fills a class creation step with detected student names |

---

## User flows

### Onboarding flow (first launch only)

1. App loads; `hws_onboarded` is `false` in localStorage.
2. Splash screen displays for 1.8s.
3. Onboarding renders at step 0 (Welcome).
4. Teacher enters their name → taps "Get Started".
5. Step 1 (Classes): teacher enters one or more class names → taps "Next".
6. Step 2 (Students): for each class, teacher enters student names (or skips by leaving blank) → taps "Finish Setup".
7. `handleOnboardDone(name, classes)` is called: sets `hws_teacher`, `hws_classes`, `hws_onboarded` in localStorage.
8. Main app renders with Upload tab active.

### First-time upload flow (no classes)

1. Teacher skips onboarding or finishes onboarding with no students.
2. Lands on Upload tab; sees hint: "No classes yet — upload your first sheet and we'll create one from it."
3. Uploads image and taps "Read & Parse Notes".
4. API call sends `studentNames: []`, `className: ""` — Claude reads names directly from the image.
5. After parse: "Create Class" step appears with the detected student names pre-filled.
6. Teacher enters a class name; verifies and edits the student list; can add or remove names.
7. Taps "Create Class & Continue" (button is disabled if class name is empty or student list is empty).
8. Class is saved to `localStorage` (`hws_classes`); teacher proceeds to Review (step 2) with the already-parsed data.

### Upload and generate flow (daily use)

1. Teacher opens app (or switches to Upload tab).
2. Selects class from dropdown; confirms or changes date.
3. Taps the upload zone → device camera or file picker opens.
4. Selects or photographs handwritten progress sheet.
5. `handleFile(file)` runs: reads file as data URL, stores base64 in component state.
6. Taps "Read & Parse Notes". `loading` state is set to `true`; spinner shows.
7. **[Not yet implemented — mock in prototype]** `fetch("POST /api/parse", { imageBase64, classId })` sends request to backend.
8. Backend calls `anthropic.messages.create()` with image and system prompt containing the class's student list.
9. Claude returns a JSON array; API route parses and returns `{ students: [...] }`.
10. `students` state is populated; `loading` is set to `false`; component moves to step 2 (Review).
11. Teacher scans student cards. Yellow-bordered cards (uncertain) are expanded automatically.
12. Teacher edits any incorrect field values inline.
13. Taps "Generate N Messages". `saveHistory(classId, entry)` is called; component moves to step 3 (Send).
14. Teacher taps "Copy" on individual cards or "Copy All" to copy all messages to clipboard.
15. Teacher pastes each message into the relevant WhatsApp parent group or individual chat.
16. Taps "New Upload" to reset to step 1.

### History review flow

1. Teacher switches to History tab.
2. Selects class from dropdown.
3. Students with history entries appear in a tappable list; students with no entries appear dimmed below.
4. Teacher taps a student name.
5. Per-student view shows all history entries for that student, newest first.
6. Each entry card shows: date, homework status badge, SP score, TX score.
7. Taps "← [ClassName]" to return to the class list.

### Settings — edit message flow

1. Teacher switches to Settings tab (default section: Message).
2. "Sample Message Preview" card shows the current template with `{{vars}}` visible.
3. Teacher taps the card ("Tap to edit").
4. Textarea appears in edit mode with current template pre-filled.
5. Teacher edits the text, keeping `{{vars}}` in place.
6. Taps "Save". `setSampleMessage(draft)` persists to localStorage. Edit mode closes; "Saved!" confirmation appears for 2s.
7. To restore defaults, teacher taps "Reset" while in edit mode. Draft is set to `DEFAULT_SAMPLE_MESSAGE`.

### Settings — manage classes flow

1. Teacher switches to Settings → Classes section.
2. Accordion list shows all classes.
3. Tap a class to expand: rename field, student list with remove buttons, "Add student" inline input, "Delete Class" button.
4. Add student: type name, tap "Add" or press Enter. Student is appended to class's student array in `hws_classes`.
5. Remove student: tap the "✕" button next to a student name. Student is filtered from the array.
6. Delete class: taps "Delete Class". Class is removed from `hws_classes`. If this class was expanded, `editingClass` is cleared.
7. All changes write to `hws_classes` in localStorage immediately via the `useLocalStorage` hook.

---

## Component tree

```
App (app/page.tsx)
├── [loading === true]
│   └── Splash
├── [!onboarded]
│   └── Onboarding
│       └── (3 inline step views: Welcome, Classes, Students)
└── [onboarded]
    ├── Header (inline JSX — app name + current tab label)
    ├── [tab === "upload"]
    │   └── UploadTab
    │       ├── Steps (progress indicator: Upload → Review → Send)
    │       ├── [step === 1]
    │       │   ├── Class selector (inline <select>)
    │       │   ├── Date input (inline <input type="date">)
    │       │   └── Drop zone / file input
    │       ├── [step === 2]
    │       │   └── StudentCard[] (one per parsed student)
    │       └── [step === 3]
    │           └── Message card[] (one per student, with Copy button)
    ├── [tab === "history"]
    │   └── HistoryTab
    │       ├── [selStudent === null]
    │       │   ├── Class selector
    │       │   ├── Students with history (tappable list)
    │       │   └── Students without history (dimmed list)
    │       └── [selStudent !== null]
    │           └── HistoryEntry card[] (one per entry, newest first)
    ├── [tab === "settings"]
    │   └── SettingsTab
    │       ├── Section tab bar (Message | Classes | Profile)
    │       ├── [section === "message"]
    │       │   ├── Preview card (read mode)
    │       │   └── Textarea + Save/Cancel/Reset (edit mode)
    │       ├── [section === "classes"]
    │       │   ├── Class accordion[]
    │       │   │   └── AddStudentInline (per class, when expanded)
    │       │   └── "+ Add Class" button
    │       └── [section === "profile"]
    │           ├── Teacher name input
    │           └── Reset button
    └── BottomNav
```

---

## State inventory

### localStorage state (persisted across sessions)

All localStorage state is managed by the `useLocalStorage(key, initial)` hook defined at the top of `app/page.tsx`. The hook initialises from localStorage on first render and writes back on every change via a `useEffect`.

| Key | Type | Controls |
|---|---|---|
| `hws_onboarded` | `boolean` | Whether to show Onboarding or the main app |
| `hws_teacher` | `string` | Teacher's name (shown in sign-off; editable in Settings → Profile) |
| `hws_classes` | `Class[]` | All class records including student lists |
| `hws_template` | `string` | Message template with `{{vars}}` placeholders (default: `DEFAULT_SAMPLE_MESSAGE`) |
| `hws_history` | `HistoryStore` | All historical entries, keyed by `classId → studentName → HistoryEntry[]` |

### Component state (lost on page reload)

**App component**
| State | Type | Controls |
|---|---|---|
| `loading` | `boolean` | Splash screen visibility (true for 1.8s on mount) |
| `tab` | `"upload" \| "history" \| "settings"` | Which tab is active |

**Onboarding component**
| State | Type | Controls |
|---|---|---|
| `step` | `0 \| 1 \| 2` | Which onboarding step is shown |
| `teacherName` | `string` | Name input value |
| `classes` | `Class[]` | Classes being configured during onboarding |

**UploadTab component**
| State | Type | Controls |
|---|---|---|
| `step` | `1 \| 2 \| 3` | Upload / Review / Send phase |
| `selClass` | `string` | Selected class ID |
| `date` | `string` | Selected date (ISO format `YYYY-MM-DD`) |
| `preview` | `string \| null` | Data URL for image preview thumbnail |
| `imageData` | `string \| null` | Base64 string (no data URL prefix) sent to API |
| `dragging` | `boolean` | Drag-over visual state on drop zone |
| `loading` | `boolean` | True while API call is in flight |
| `students` | `ParsedStudent[]` | AI-parsed (and teacher-edited) student array |
| `copied` | `Record<string, boolean>` | Per-student copy button state (true for 2s after copy) |
| `allCopied` | `boolean` | "Copy All" button state (true for 2.5s after copy) |
| `pendingStudents` | `ParsedStudent[] \| null` | Stores parse results while the teacher is in the Create Class step (first-upload flow only); null in all other states |

**StudentCard component**
| State | Type | Controls |
|---|---|---|
| `expanded` | `boolean` | Whether the card shows editable fields; initialised to `student.uncertain` |

**HistoryTab component**
| State | Type | Controls |
|---|---|---|
| `selClass` | `string` | Selected class ID |
| `selStudent` | `string \| null` | Selected student name; null shows class list view |

**SettingsTab component**
| State | Type | Controls |
|---|---|---|
| `section` | `"message" \| "classes" \| "profile"` | Active sub-section |
| `editing` | `boolean` | Whether message textarea is in edit mode |
| `draft` | `string` | Unsaved textarea content (initialised from `sampleMessage` prop) |
| `saved` | `boolean` | "Saved!" confirmation visibility (true for 2s after save) |
| `editingClass` | `string \| null` | Which class accordion is expanded |

---

## API contracts

### POST /api/parse

**Status:** This route is not yet implemented. The prototype mocks the response with generated fake data in `UploadTab.handleParse()`. The route must be created at `app/api/parse/route.ts`.

**Request body**
```typescript
{
  imageBase64: string;      // base64-encoded JPEG, no data URL prefix
  classId: string;          // ID of the class record from hws_classes
  studentNames: string[];   // ordered list of student names for prompt grounding
                            // Pass [] for the first-upload flow (no classes yet);
                            // Claude will read names directly from the image
}
```

**Success response** — HTTP 200
```typescript
{
  students: ParsedStudent[];
}
```

**Error response** — HTTP 422 (parse failed) or 500 (API error)
```typescript
{
  error: "parse_failed" | "api_error" | "invalid_request";
  message: string;
  raw?: string;  // raw Claude response text, present on parse_failed
}
```

**How the API route should construct the Anthropic call**

```typescript
import Anthropic from "@anthropic-ai/sdk";
const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

const response = await client.messages.create({
  model: "claude-sonnet-4-6",
  max_tokens: 2048,
  system: buildSystemPrompt(studentNames),  // see Prompt Engineering in design-decisions.md
  messages: [
    {
      role: "user",
      content: [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: "image/jpeg",
            data: imageBase64,
          },
        },
        {
          type: "text",
          text: "Parse the handwritten student progress notes in this image.",
        },
      ],
    },
  ],
});
```

### POST /api/chat (existing, unrelated)

This route (`app/api/chat/route.ts`) is the starter AI assistant route from the base project. It accepts `{ question, pdfText }` and returns `{ answer }`. It is not part of the Homework Success feature set and can be left in place or removed.

### POST /api/upload (existing, unrelated)

This route (`app/api/upload/route.ts`) extracts text from uploaded PDF files using the `unpdf` package. It is not part of the Homework Success feature set.

---

## Template variable reference

The message template is stored as a plain string in `hws_template` (localStorage) with these placeholder tokens:

| Variable | Renders to | Example |
|---|---|---|
| `{{studentName}}` | The student's name from the parsed or edited card | `Oliver` |
| `{{className}}` | The name of the selected class | `P2 Kindness` |
| `{{date}}` | The session date, formatted as `D Month YYYY` (en-SG locale) | `13 May 2026` |
| `{{homework}}` | The student's homework field; `NA` if blank | `Maths` or `NA` |
| `{{sp}}` | The student's SP (spelling) score or comment; `—` if null | `11/11 Unit 8` |
| `{{tx}}` | The student's TX (tingxie / Chinese spelling) score; `—` if null | `9/9 Unit 9` |

`generateMessage(student, className, date, template)` in `app/page.tsx` performs a global `String.replace()` for each variable. All six variables must be present in the template for the output to be correct. The "Reset" button in Settings → Message restores the default template which contains all six.

**Default template:**
```
Homework Success HWS

Dear {{className}} Parents,

{{studentName}} Update — {{date}}
Homework: {{homework}}

SP: {{sp}}
TX: {{tx}}

With Love & Light,
Teacher Yie Teng
```

Note: the sign-off `Teacher Yie Teng` is hardcoded in the default template. If the teacher changes their name in Settings → Profile, the template is not automatically updated. A `{{teacherName}}` variable should be added in a future iteration.

---

## Data model

```typescript
// A class taught by the teacher
interface Class {
  id: string;          // client-generated timestamp string, e.g. "1716566400000"
  name: string;        // e.g. "P2 Kindness"
  students: string[];  // ordered list of student names, e.g. ["Arissa", "Jerome", ...]
}

// One student's data as returned by Claude and displayed on a review card
interface ParsedStudent {
  name: string;          // matched to the known student list
  homework: string;      // homework description or "NA"
  sp: string | null;     // spelling score/comment, e.g. "9/11 Unit 8" or "No Spelling"
  tx: string | null;     // tingxie score/comment, e.g. "9/9 Unit 9"
  uncertain: boolean;    // true if Claude was unsure about any value for this student
}

// One session entry saved to history per student
interface HistoryEntry {
  date: string;          // formatted date string, e.g. "13 May 2026"
  homework: string;      // e.g. "Maths" or "NA"
  sp: string | null;
  tx: string | null;
}

// Shape of the hws_history localStorage key
type HistoryStore = {
  [classId: string]: {
    [studentName: string]: HistoryEntry[];
  };
};
```

`saveHistory(classId, entry)` in `App` (app/page.tsx, line ~679) iterates over `entry.students` and appends a `HistoryEntry` to each student's array in `HistoryStore`. If the student does not yet have an entry in the store, the array is initialised as `[]`.

---

## Known limitations and TODO list

### P1 — Fix before first real-world use

**1. Camera-first upload CTA**
The upload zone is a drag-and-drop pattern inherited from the prototype, which was built for desktop. On mobile the primary action must be a large "Take Photo" button (`<input type="file" accept="image/*" capture="environment">`), with "Choose from Library" as a secondary option. The drag-and-drop zone is irrelevant on touch devices.

**2. Review cards — show data inline without expanding**
Currently all review cards except uncertain ones are collapsed on step 2. The teacher must tap each card to see the parsed values. With 12+ students this is unusable. SP and TX values should be visible on the card face. Tapping should open an edit mode, not reveal the data.

**3. Toast notification on copy**
There is no feedback when a message is copied except the button text changing briefly to "Copied". A toast/snackbar sliding up from the bottom of the screen is the standard mobile pattern and should be added.

**4. Onboarding skip option**
Forcing the teacher to enter all student names during onboarding causes drop-off. The "Finish Setup" button should be available after entering a teacher name and at least one class name, with zero students. Students can be added later in Settings → Classes.

### P2 — Important, implement after P1

**5. Live preview in Settings message editor**
The textarea editor shows the raw template. The teacher has no way to verify the output until they generate messages. A live preview pane below the editor — rendering one example message using `SAMPLE` data — would immediately show formatting errors.

**6. History date filtering**
The per-student history list grows indefinitely. Add filter chips: "This week / This month / All."

**7. Typography hierarchy**
Text sizing is uniform (11–15px) across the Upload screen. Add a larger, bolder heading to anchor the teacher visually before they interact with the upload zone.

### Implementation gaps (not UX — engineering TODOs)

- `/api/parse` route does not exist yet. The prototype mocks the parse call with fake data in `UploadTab.handleParse()`. Creating this route is the single most critical engineering task.
- Client-side canvas resize is not implemented in the prototype. It must be added in `app/page.tsx` before `imageData` is set in state.
- The `{{teacherName}}` template variable is missing. The teacher's name is hardcoded as `Teacher Yie Teng` in the default template string.
- `navigator.clipboard.writeText()` requires `https://` or `localhost`. If deployed over http, clipboard copy silently fails. Ensure the deployment uses HTTPS.

---

## How to pick up this project as a new developer or agent

### What to read first

1. This file (`docs/functionality-spec.md`) — full feature inventory, state map, data model.
2. `docs/design-decisions.md` — why Next.js, why localStorage, why Sonnet, how the prompt works.
3. `/root/.claude/uploads/cf4c0f7d-6196-5c1d-ada8-ee7d58cc8da5/5df7f5e6-mockuphomeworksuccess.tsx` — the full 727-line React prototype. This is the single most complete reference for the intended behaviour. The production code in `app/page.tsx` will replace and extend this.
4. `app/api/chat/route.ts` — the working Anthropic SDK integration pattern. `/api/parse` should follow this structure.

### How to run locally

```bash
cd /home/user/ai-assistant
npm install
# Create .env.local with:
# ANTHROPIC_API_KEY=sk-ant-...
npm run dev
# Opens on http://localhost:3000
```

The app uses Next.js 16.2.7 with React 19.2.4. Node.js 18+ required. There is no database to set up; all state is localStorage.

### Where the AI logic lives (today and target)

| File | Purpose |
|---|---|
| `app/api/chat/route.ts` | Existing Anthropic SDK call (chat/Q&A feature, unrelated to HWS) |
| `app/api/parse/route.ts` | **Does not exist yet.** Must be created. This is where Claude vision parsing lives. |
| `app/page.tsx` | All client-side React. The `handleParse()` function in `UploadTab` currently mocks the parse call and must be replaced with a `fetch("/api/parse", ...)` call. |

### First task for a new agent

The highest-value first task is creating `app/api/parse/route.ts`. The route must:

1. Accept `POST` with body `{ imageBase64: string, studentNames: string[] }`.
2. Build the system prompt (see the full prompt in `docs/design-decisions.md`, section "System prompt design").
3. Call `anthropic.messages.create()` with `model: "claude-sonnet-4-6"`, the system prompt, and a user message containing an `image` block and a `text` block.
4. Call `JSON.parse()` on the text content of the response.
5. Return `{ students: ParsedStudent[] }` on success or `{ error, message, raw }` on failure.

Then update `UploadTab.handleParse()` in `app/page.tsx` to call this route instead of generating mock data.

### Coding conventions in the codebase

- All API routes are in `app/api/*/route.ts` and export named async functions `GET`, `POST`, etc.
- Client components are marked `"use client"` at the top.
- The prototype uses inline style objects rather than Tailwind classes for component styling. The production app may adopt Tailwind (it is installed) but the prototype precedent is inline styles.
- `useLocalStorage(key, initial)` is the project's bespoke hook for persistent state. It is defined at the top of `app/page.tsx` and should remain there until the file is split.
- TypeScript is enabled but the prototype is `.tsx`-compatible JavaScript without type annotations on component props. Add types incrementally as routes and hooks are formalised.
