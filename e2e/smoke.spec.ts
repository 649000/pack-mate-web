import { expect, test } from "@playwright/test";

test("landing page is public", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /pack smarter for/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /get started for free/i }).first()).toBeVisible();
});

test("landing shows the marketing sections", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /pack smarter for/i })).toBeVisible();
  await expect(page.getByText(/simple & transparent pricing/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: /loved by thousands/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /contact us/i })).toBeVisible();
});

test("landing call to action leads to sign-in", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("link", { name: /get started for free/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/sign-in$/);
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
