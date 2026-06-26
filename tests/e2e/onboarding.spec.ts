import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // Clear localStorage so each test starts fresh
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("shows splash then onboarding on first load", async ({ page }) => {
  await expect(page.getByText("Homework Success")).toBeVisible();
  // After splash (1.8s), onboarding welcome step appears
  await expect(page.getByText("Welcome to")).toBeVisible({ timeout: 4000 });
});

test("onboarding: cannot proceed without teacher name", async ({ page }) => {
  await page.waitForSelector("text=Get Started", { timeout: 4000 });
  const btn = page.getByRole("button", { name: "Get Started" });
  await expect(btn).toBeDisabled();
});

test("onboarding: full flow with class and students", async ({ page }) => {
  await page.waitForSelector("text=Your name", { timeout: 4000 });
  await page.getByPlaceholder("e.g. Teacher Yie Teng").fill("Teacher Test");
  await page.getByRole("button", { name: "Get Started" }).click();

  await page.getByPlaceholder(/Class 1 name/).fill("P2 Kindness");
  await page.getByRole("button", { name: "Next" }).click();

  await page.getByPlaceholder("Student 1").fill("Oliver");
  await page.getByRole("button", { name: "Finish Setup" }).click();

  // Should land on main app Upload tab
  await expect(page.getByText("Upload & Generate")).toBeVisible();
});

test("onboarding: skip setup reaches app with empty state on upload", async ({
  page,
}) => {
  await page.waitForSelector("text=Skip", { timeout: 4000 });
  await page.getByText(/Skip/).click();

  await expect(page.getByText(/No classes yet/)).toBeVisible();
});
