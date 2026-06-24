# Playwright E2E Test Gotchas

A record of Playwright test failures encountered in this project, their root causes, and the fixes applied. Use this as a reference when writing or debugging selectors.

---

## Failure 1: "Next" button — strict mode violation

**Selector used:**
```js
getByRole("button", { name: "Next" })
```

**Error:** Strict mode violation — resolved to 2 elements.

**Root cause:** Next.js dev mode injects a floating "Open Next.js Dev Tools" button into the DOM. `getByRole` uses substring matching by default, so `"Next"` matches both the app's "Next →" button and the injected Dev Tools button whose aria-label also contains "Next".

**Fix:** Use the full, exact label including the arrow suffix, which is unique to the app button:
```js
getByRole("button", { name: "Next →" })
```

---

## Failure 2: "No classes set up yet" — text mismatch

**Selector used:**
```js
getByText("No classes set up yet")
```

**Error:** Element not found.

**Root cause:** The app's copy was updated to "No classes yet — upload your first sheet and we'll create one". The test used a hardcoded exact string that no longer matched.

**Fix:** Use a regex so the test matches on the stable part of the string and survives future copy edits:
```js
getByText(/No classes yet/)
```

---

## Failure 3: `{{studentName}}` — strict mode violation

**Selector used:**
```js
getByText("{{studentName}}")
```

**Error:** Strict mode violation — resolved to 2 elements.

**Root cause:** `getByText` performs substring/partial matching by default. There are two elements that contain the string `{{studentName}}`: a `<code>` element whose full text is exactly `{{studentName}}`, and a `<pre>` preview block whose text is the entire template (which includes `{{studentName}}` as a substring). Both match.

**Fix:** Add `{ exact: true }` to require the element's full text content to equal the search string exactly. The `<pre>` block has far more text and is excluded:
```js
getByText("{{studentName}}", { exact: true })
getByText("{{className}}",   { exact: true })
getByText("{{sp}}",          { exact: true })
```

---

## Failure 4: "Homework Success HWS" — strict mode violation after Reset

**Selector used:**
```js
getByText("Homework Success HWS")
```

**Error:** Strict mode violation — resolved to 2 elements.

**Root cause:** After clicking Reset, the template content is restored simultaneously in the `<textarea>` (edit mode) and the `<pre>` preview panel. Both elements end up with identical text, so `getByText` matches both.

**Fix:** Scope the locator to the textarea role so only the edit field is targeted:
```js
getByRole("textbox").toContainText("Homework Success HWS")
```

---

## Failure 5: "P2 Kindness" — hidden option element

**Selector used:**
```js
getByText("P2 Kindness")
```

**Error:** Element found but `toBeVisible()` failed with `Received: hidden`.

**Root cause:** "P2 Kindness" is an `<option>` element inside a `<select>`. Playwright considers `<option>` elements hidden because they are not directly rendered on screen — the `<select>` widget renders the chosen value, not the individual options. Asserting visibility on an `<option>` will always fail.

**Fix:** Assert on the parent `<select>`, which is visible and whose text content includes the option text:
```js
locator("select").toContainText("P2 Kindness")
```

---

## General Rules

| # | Rule | When it applies |
|---|------|----------------|
| 1 | Use exact button labels, including punctuation and suffixes | Any page running in Next.js dev mode, or anywhere third-party UI may be injected |
| 2 | Use regex matchers (`/partial string/`) for user-facing copy | Text that might be reworded without changing meaning |
| 3 | Use `{ exact: true }` for short strings or template variables | When the string is a substring of a larger element (e.g. a `<pre>` preview) |
| 4 | Check the parent `<select>`, not the `<option>` | Any assertion involving dropdown option text visibility |
| 5 | Scope to a specific role when sibling elements share identical content | Edit/preview pairs, or any duplicated-text pattern in the DOM |
