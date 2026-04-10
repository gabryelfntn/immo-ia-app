import { test, expect } from "@playwright/test";

test("page de connexion se charge", async ({ page }) => {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/login/);
  await expect(page.locator("h1")).toHaveText("ImmoAI", { timeout: 15_000 });
});
