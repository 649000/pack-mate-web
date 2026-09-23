import { expect, test } from "@playwright/test";

const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1280, height: 800 },
];

test("sign-in switches between sign in and create account", async ({ page }) => {
  await page.goto("/sign-in");
  await expect(page.getByRole("button", { name: /^sign in$/i })).toBeVisible();
  await page.getByRole("button", { name: /create one/i }).click();
  await expect(page.getByRole("button", { name: /create account/i })).toBeVisible();
});

test("sign-up requires a password of at least 8 characters", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByRole("button", { name: /create one/i }).click();
  await expect(page.getByLabel("Password")).toHaveAttribute("minlength", "8");
});

test("sign-in requires email and password", async ({ page }) => {
  await page.goto("/sign-in");
  await expect(page.getByLabel("Email")).toHaveAttribute("required", "");
  await expect(page.getByLabel("Password")).toHaveAttribute("required", "");
});

test("sign-in links to the reset password page and requests a reset", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByRole("link", { name: /forgot password/i }).click();
  await expect(page).toHaveURL(/\/reset-password$/);
  await expect(page.getByRole("heading", { name: /reset password/i })).toBeVisible();
  await page.getByLabel("Email").fill(`packmate-reset-${Date.now()}@example.com`);
  await page.getByRole("button", { name: /send reset link/i }).click();
  await expect(page.getByText(/password reset link sent/i)).toBeVisible();
});

test("unknown route returns 404", async ({ page }) => {
  const response = await page.goto("/this-route-does-not-exist");
  expect(response?.status()).toBe(404);
});

for (const viewport of viewports) {
  test(`landing has no horizontal overflow on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /pack lighter/i })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test(`sign-in has no horizontal overflow on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/sign-in");
    await expect(page.getByLabel("Email")).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
}
