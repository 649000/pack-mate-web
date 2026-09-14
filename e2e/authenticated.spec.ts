import { expect, test } from "@playwright/test";

// Authenticated flows need the auth role-claim function deployed, so they only
// run when explicitly enabled (e.g. after a deploy).
const enabled = process.env.E2E_AUTH === "1";

test.describe("authenticated critical path", () => {
  test.skip(!enabled, "Set E2E_AUTH=1 to run authenticated flows against a live backend");

  test("sign up, create a trip, pack an item, delete the trip", async ({ page }) => {
    const email = `packmate-e2e-${Date.now()}@example.com`;
    const password = "Test-pass-123456";

    // Sign up.
    await page.goto("/sign-in");
    await page.getByRole("button", { name: /create one/i }).click();
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: /create account/i }).click();
    await expect(page).toHaveURL(/\/trips$/);

    // Create a trip.
    await page.getByRole("button", { name: /new trip/i }).click();
    await page.getByLabel("Name").fill("Japan");
    await page.getByRole("button", { name: /^save$/i }).click();
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
    await page.getByRole("link", { name: /back to trips/i }).click();
    await expect(page).toHaveURL(/\/trips$/);
    await page.getByRole("button", { name: /^delete$/i }).click();
    await page
      .getByRole("button", { name: /^delete$/i })
      .last()
      .click();
    await expect(page.getByText("Japan")).toHaveCount(0);
  });
});
