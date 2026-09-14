import { expect, test, type Page } from "@playwright/test";

// Authenticated flows need the auth role-claim function deployed, so they only
// run when explicitly enabled (e.g. after a deploy).
const enabled = process.env.E2E_AUTH === "1";

async function signUp(page: Page): Promise<void> {
  const email = `packmate-e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  await page.goto("/sign-in");
  await page.getByRole("button", { name: /create one/i }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("Test-pass-123456");
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page).toHaveURL(/\/trips$/);
}

test.describe("authenticated critical path", () => {
  test.skip(!enabled, "Set E2E_AUTH=1 to run authenticated flows against a live backend");

  test("sign up, create a trip, pack an item, delete the trip", async ({ page }) => {
    await signUp(page);

    // Create a trip.
    await page.getByRole("button", { name: /new trip/i }).click();
    await page.getByLabel("Name").fill("Japan");
    await page.getByRole("button", { name: /^save$/i }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByText("Japan")).toBeVisible();

    // Open the trip and add a one-off item.
    await page.getByText("Japan").click();
    await expect(page).toHaveURL(/\/trip\?id=/);
    await page.getByLabel("Add a one-off item").fill("Passport");
    await page.getByRole("button", { name: /^add$/i }).click();
    await expect(page.getByText("Passport")).toBeVisible();

    // Pack it.
    await page.getByRole("checkbox", { name: /mark packed/i }).click();
    await expect(page.getByText(/1\/1 packed/i).first()).toBeVisible();

    // Delete the trip.
    await page.goto("/trips");
    await expect(page).toHaveURL(/\/trips$/);
    await page.getByRole("button", { name: /^delete$/i }).click();
    await page
      .getByRole("button", { name: /^delete$/i })
      .last()
      .click();
    await expect(page.getByText("Japan")).toHaveCount(0);
  });

  test("app shell provides navigation on mobile and desktop", async ({ page }) => {
    await signUp(page);

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/trips");
    await expect(page.getByRole("button", { name: /^bags$/i }).first()).toBeVisible();

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/trips");
    await page.getByRole("button", { name: /open navigation/i }).click();
    await expect(page.getByRole("button", { name: /^items$/i }).last()).toBeVisible();
  });

  test("empty states and responsive layout across app screens", async ({ page }) => {
    await signUp(page);

    await expect(page.getByText(/no trips yet/i)).toBeVisible();
    await page.goto("/bags");
    await expect(page.getByText(/no bags yet/i)).toBeVisible();
    await page.goto("/items");
    await expect(page.getByText(/no items yet/i)).toBeVisible();

    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: 800 });
      for (const path of ["/trips", "/bags", "/items", "/account"]) {
        await page.goto(path);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        expect(overflow, `${path} at ${width}px`).toBeLessThanOrEqual(1);
      }
    }
  });

  test("saves profile details and exports data", async ({ page }) => {
    await signUp(page);

    await page.goto("/account");
    await expect(page).toHaveURL(/\/account$/);
    await expect(page.getByText(/personal info/i)).toBeVisible();

    await page.getByLabel("Name").fill("Ada Lovelace");
    await page.getByRole("button", { name: /save changes/i }).click();
    await expect(page.getByText(/profile saved/i)).toBeVisible();

    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: /export data/i }).click();
    expect((await download).suggestedFilename()).toMatch(/pack-mate-export/);
  });

  test("shows the account entry point in the user menu", async ({ page }) => {
    await signUp(page);

    await page.getByRole("button", { name: /user menu/i }).click();
    await page.getByRole("menuitem", { name: /account/i }).click();
    await expect(page).toHaveURL(/\/account$/);
  });
});
