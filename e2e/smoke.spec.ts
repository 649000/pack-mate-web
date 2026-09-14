import { expect, test } from "@playwright/test";

test("landing page is public", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /know what you are bringing/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /get started/i })).toBeVisible();
});

test("app routes require authentication", async ({ page }) => {
  await page.goto("/trips");
  await expect(page).toHaveURL(/\/sign-in$/);
});

test("sign-in page offers email, password and Google", async ({ page }) => {
  await page.goto("/sign-in");
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
  await expect(page.getByRole("button", { name: /continue with google/i })).toBeVisible();
});
