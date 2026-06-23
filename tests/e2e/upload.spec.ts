import { test, expect } from "@playwright/test";
import path from "path";

async function setupWithClass(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector("text=Your name", { timeout: 4000 });
  await page.getByPlaceholder("e.g. Teacher Yie Teng").fill("Teacher Test");
  await page.getByRole("button", { name: "Get Started" }).click();
  await page.getByPlaceholder(/Class 1 name/).fill("P2 Kindness");
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByPlaceholder("Student 1").fill("Oliver");
  await page.getByRole("button", { name: "Finish Setup" }).click();
  await page.waitForSelector("text=Upload & Generate");
}

test("upload tab shows class selector and date", async ({ page }) => {
  await setupWithClass(page);
  await expect(page.getByText("P2 Kindness")).toBeVisible();
  // Date input present
  await expect(page.locator('input[type="date"]')).toBeVisible();
});

test("parse button disabled without image", async ({ page }) => {
  await setupWithClass(page);
  const parseBtn = page.getByRole("button", { name: /Read & Parse/ });
  await expect(parseBtn).toBeDisabled();
});

test("file input has capture=environment attribute", async ({ page }) => {
  await setupWithClass(page);
  const fileInput = page.locator('input[type="file"]');
  await expect(fileInput).toHaveAttribute("capture", "environment");
});

test("uploading an image enables parse button", async ({ page }) => {
  await setupWithClass(page);

  // Create a minimal 1x1 PNG as a test image
  const imageBuffer = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64"
  );

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: "test-sheet.png",
    mimeType: "image/png",
    buffer: imageBuffer,
  });

  await expect(
    page.getByRole("button", { name: /Read & Parse/ })
  ).toBeEnabled({ timeout: 3000 });
});

test("empty state shown when no classes", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector("text=Skip", { timeout: 4000 });
  await page.getByText(/Skip/).click();
  await expect(page.getByText("No classes set up yet")).toBeVisible();
});
