import { test, expect } from "@playwright/test";

async function completeOnboarding(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector("text=Your name", { timeout: 4000 });
  await page.getByPlaceholder("e.g. Teacher Yie Teng").fill("Teacher Test");
  await page.getByRole("button", { name: "Get Started" }).click();
  await page.getByPlaceholder(/Class 1 name/).fill("P2 Kindness");
  await page.getByRole("button", { name: "Next →" }).click();
  await page.getByPlaceholder("Student 1").fill("Oliver");
  await page.getByRole("button", { name: "Finish Setup" }).click();
  await page.waitForSelector("text=Upload & Generate");
}

test("Settings: template editor shows {{vars}} not rendered names", async ({
  page,
}) => {
  await completeOnboarding(page);
  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.getByText("{{studentName}}")).toBeVisible();
  await expect(page.getByText("{{className}}")).toBeVisible();
  await expect(page.getByText("{{sp}}")).toBeVisible();
});

test("Settings: edit and save custom template persists on reload", async ({
  page,
}) => {
  await completeOnboarding(page);
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByText("Tap to edit").click();
  const textarea = page.getByRole("textbox");
  await textarea.clear();
  await textarea.fill("Hello {{studentName}}, your SP is {{sp}}.");
  await page.getByRole("button", { name: "Save" }).click();

  await page.reload();
  await page.getByRole("button", { name: "Settings" }).click();
  await expect(page.getByText("Hello {{studentName}}")).toBeVisible();
});

test("Settings: Reset restores default template", async ({ page }) => {
  await completeOnboarding(page);
  await page.getByRole("button", { name: "Settings" }).click();
  await page.getByText("Tap to edit").click();
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByText("Homework Success HWS")).toBeVisible();
});
