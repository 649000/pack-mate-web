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

test("shared link page is public and needs no sign-in", async ({ page }) => {
  await page.goto(`/share?t=${"a".repeat(64)}`);
  await expect(page).toHaveURL(/\/share/);
  await expect(page.getByText(/shared packing list/i)).toBeVisible();
  await expect(page.getByText(/not available/i)).toBeVisible();
});

test("shared link page shows an unavailable state for a malformed token", async ({ page }) => {
  await page.goto("/share?t=nope");
  await expect(page).toHaveURL(/\/share/);
  await expect(page.getByText(/not available/i)).toBeVisible();
});

test("shared page is not indexed and does not leak its URL as a referrer", async ({ page }) => {
  await page.goto(`/share?t=${"a".repeat(64)}`);

  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.locator('meta[name="referrer"]')).toHaveAttribute("content", "no-referrer");

  await Promise.all([
    page.waitForURL(/\/sign-in$/),
    page
      .evaluate(() => {
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/sign-in";
      })
      .catch(() => {}),
  ]);
  expect(await page.evaluate(() => document.referrer)).toBe("");
});
