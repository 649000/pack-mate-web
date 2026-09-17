import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";

// Authenticated flows authenticate through Firebase and the local Supabase stack
// cannot verify Firebase tokens, so these only run against the deployed backend
// when explicitly enabled (e.g. after a deploy). See
// openspec/changes/harden-test-and-delivery-pipeline/design.md.
const enabled = process.env.E2E_AUTH === "1";

async function signUp(page: Page): Promise<void> {
  const email = `packmate-e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  // Random per run so no credential literal lives in the repo.
  const password = `Test-pass-${randomUUID()}`;
  await page.goto("/sign-in");
  await page.getByRole("button", { name: /create one/i }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page).toHaveURL(/\/trips$/);
}

// The library pickers are searchable, so options are chosen by typing rather
// than selecting from a native control.
async function pickLibraryOption(page: Page, label: string, name: string): Promise<void> {
  await page.getByLabel(label).click();
  await page.getByLabel("Search options").fill(name);
  await page.getByRole("option", { name }).first().click();
}

// Adding happens in a dialog with one tab per input mode.
async function openAddDialog(page: Page, tab: RegExp): Promise<void> {
  await page.getByRole("button", { name: /add to trip/i }).click();
  await page.getByRole("tab", { name: tab }).click();
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
    await openAddDialog(page, /one-off item/i);
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
    await page
      .getByRole("button", { name: /shared links/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/shares$/);

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
    await page.goto("/shares");
    await expect(page.getByText(/no shared links yet/i)).toBeVisible();

    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: 800 });
      for (const path of ["/trips", "/bags", "/items", "/account", "/shares"]) {
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

  test("adds item details and finds the item in a trip", async ({ page }) => {
    await signUp(page);

    // Create a library item with details.
    await page.goto("/items");
    await page.getByRole("button", { name: /add item/i }).click();
    await page.getByLabel("Name").fill("Passport");
    await page.getByLabel("Description").fill("Navy cover");
    await page.getByLabel("Link").fill("https://example.com/passport");
    await page.getByRole("button", { name: /^save$/i }).click();
    // Wait for the dialog to close so the save has committed before asserting;
    // the description text also exists in the open dialog's textarea.
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByText("Navy cover")).toBeVisible();

    // Create a trip and add the item to it.
    await page.goto("/trips");
    await page.getByRole("button", { name: /new trip/i }).click();
    await page.getByLabel("Name").fill("Japan");
    await page.getByRole("button", { name: /^save$/i }).click();
    await page.getByText("Japan").click();
    await expect(page).toHaveURL(/\/trip\?id=/);

    await openAddDialog(page, /library item/i);
    await pickLibraryOption(page, "Add an item from your library", "Passport");
    await page.getByRole("button", { name: /^add item$/i }).click();
    // The name also appears as an <option> in the library select, so anchor on
    // the entry row's unique field instead of the text.
    await expect(page.getByLabel("Quantity for Passport")).toBeVisible();

    // Search for the item and confirm its location is shown.
    await page.getByLabel("Search items").fill("pass");
    await expect(page.getByText("1 match")).toBeVisible();
    await expect(page.getByText("Not assigned")).toBeVisible();
  });

  test("tracks a bag's weight against its limit", async ({ page }) => {
    await signUp(page);

    // Create a bag with a 1 kg limit.
    await page.goto("/bags");
    await page.getByRole("button", { name: /add bag/i }).click();
    await page.getByLabel("Name").fill("Main");
    await page.getByLabel(/weight limit/i).fill("1");
    await page.getByRole("button", { name: /^save$/i }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByText(/limit 1\.00 kg/i)).toBeVisible();

    // Create a 2 kg item.
    await page.goto("/items");
    await page.getByRole("button", { name: /add item/i }).click();
    await page.getByLabel("Name").fill("Tent");
    await page.getByLabel(/weight \(kg\)/i).fill("2");
    await page.getByRole("button", { name: /^save$/i }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByText("2.00 kg")).toBeVisible();

    // Create a trip, add the bag, and put the item inside it.
    await page.goto("/trips");
    await page.getByRole("button", { name: /new trip/i }).click();
    await page.getByLabel("Name").fill("Japan");
    await page.getByRole("button", { name: /^save$/i }).click();
    await page.getByText("Japan").click();
    await expect(page).toHaveURL(/\/trip\?id=/);

    await openAddDialog(page, /library bag/i);
    await pickLibraryOption(page, "Add a bag from your library", "Main");
    await page.getByRole("button", { name: /^add bag$/i }).click();
    await openAddDialog(page, /library item/i);
    await pickLibraryOption(page, "Add an item from your library", "Tent");
    await page.getByLabel("Destination for library item").selectOption({ label: "Main" });
    await page.getByRole("button", { name: /^add item$/i }).click();

    // The trip shows the bag over its limit.
    await expect(page.getByText(/over limit/i)).toBeVisible();
    await expect(page.getByText(/total 2\.00 kg/i)).toBeVisible();
  });

  test("nests a bag and shows the full location path", async ({ page }) => {
    await signUp(page);

    // Two library bags and an item.
    await page.goto("/bags");
    for (const name of ["Suitcase", "Toiletry"]) {
      await page.getByRole("button", { name: /add bag/i }).click();
      await page.getByLabel("Name").fill(name);
      await page.getByRole("button", { name: /^save$/i }).click();
      await expect(page.getByRole("dialog")).toBeHidden();
      await expect(page.getByText(name).first()).toBeVisible();
    }
    await page.goto("/items");
    await page.getByRole("button", { name: /add item/i }).click();
    await page.getByLabel("Name").fill("Toothbrush");
    await page.getByRole("button", { name: /^save$/i }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByText("Toothbrush").first()).toBeVisible();

    // Trip with both bags, the item inside Toiletry.
    await page.goto("/trips");
    await page.getByRole("button", { name: /new trip/i }).click();
    await page.getByLabel("Name").fill("Japan");
    await page.getByRole("button", { name: /^save$/i }).click();
    await page.getByText("Japan").click();
    await expect(page).toHaveURL(/\/trip\?id=/);

    for (const name of ["Suitcase", "Toiletry"]) {
      await openAddDialog(page, /library bag/i);
      await pickLibraryOption(page, "Add a bag from your library", name);
      await page.getByRole("button", { name: /^add bag$/i }).click();
    }
    await openAddDialog(page, /library item/i);
    await pickLibraryOption(page, "Add an item from your library", "Toothbrush");
    await page.getByLabel("Destination for library item").selectOption({ label: "Toiletry" });
    await page.getByRole("button", { name: /^add item$/i }).click();

    // Nest Toiletry inside Suitcase and confirm the path.
    await page.getByLabel("Parent bag for Toiletry").selectOption({ label: "Suitcase" });
    await expect(page.getByText("Suitcase > Toiletry")).toBeVisible();

    // Search shows the full path too.
    await page.getByLabel("Search items").fill("tooth");
    await expect(page.getByText("1 match")).toBeVisible();
    await expect(page.getByText("Suitcase > Toiletry")).toBeVisible();
  });

  test("picks a library bag and item by typing on a small screen", async ({ page }) => {
    await signUp(page);

    // A library item and bag whose names only match on a non-prefix substring.
    await page.goto("/items");
    await page.getByRole("button", { name: /add item/i }).click();
    await page.getByLabel("Name").fill("Travel adapter");
    await page.getByRole("button", { name: /^save$/i }).click();
    await expect(page.getByRole("dialog")).toBeHidden();

    await page.goto("/bags");
    await page.getByRole("button", { name: /add bag/i }).click();
    await page.getByLabel("Name").fill("Main backpack");
    await page.getByRole("button", { name: /^save$/i }).click();
    await expect(page.getByRole("dialog")).toBeHidden();

    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto("/trips");
    await page.getByRole("button", { name: /new trip/i }).click();
    await page.getByLabel("Name").fill("Japan");
    await page.getByRole("button", { name: /^save$/i }).click();
    await page.getByText("Japan").click();
    await expect(page).toHaveURL(/\/trip\?id=/);

    // "backpack" and "adapter" are not prefixes of the names, so a match proves
    // substring search rather than start-of-name matching.
    await openAddDialog(page, /library bag/i);
    await pickLibraryOption(page, "Add a bag from your library", "backpack");
    await page.getByRole("button", { name: /^add bag$/i }).click();
    await expect(page.getByText("Main backpack").first()).toBeVisible();

    await openAddDialog(page, /library item/i);
    await pickLibraryOption(page, "Add an item from your library", "adapter");
    await page.getByRole("button", { name: /^add item$/i }).click();
    await expect(page.getByLabel("Quantity for Travel adapter")).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("shares a trip publicly, reflects changes, and revokes", async ({ page, browser }) => {
    test.slow();
    await signUp(page);

    // A trip with one item.
    await page.getByRole("button", { name: /new trip/i }).click();
    await page.getByLabel("Name").fill("Japan");
    await page.getByRole("button", { name: /^save$/i }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByText("Japan")).toBeVisible();
    await page.getByText("Japan").click();
    await expect(page).toHaveURL(/\/trip\?id=/);
    // Dev compiles /trip on demand; the URL updates before the route renders.
    await expect(page.getByRole("button", { name: /add to trip/i })).toBeVisible({
      timeout: 60_000,
    });
    await openAddDialog(page, /one-off item/i);
    await page.getByLabel("Add a one-off item").fill("Passport");
    await page.getByRole("button", { name: /^add$/i }).click();
    await expect(page.getByText("Passport")).toBeVisible();

    // Create the public link.
    await page.getByRole("button", { name: /^share$/i }).click();
    await page.getByRole("button", { name: /create link/i }).click();
    const shareUrl = await page.getByLabel("Link").inputValue();
    expect(shareUrl).toContain("/share?t=");
    await page.getByRole("button", { name: /^done$/i }).click();

    // A fresh anonymous context sees the list read-only.
    const context = await browser.newContext();
    const anonPage = await context.newPage();
    await anonPage.goto(shareUrl);
    await expect(anonPage.getByRole("heading", { name: "Japan" })).toBeVisible();
    await expect(anonPage.getByText("Passport")).toBeVisible();
    await expect(anonPage.getByRole("checkbox")).toHaveCount(0);

    // Packing is reflected after a refresh.
    await page.getByRole("checkbox", { name: /mark packed/i }).click();
    await expect(page.getByText(/1\/1 packed/i).first()).toBeVisible();
    await anonPage.getByRole("button", { name: /refresh/i }).click();
    await expect(anonPage.getByText(/1 of 1 packed/i)).toBeVisible();

    // Revoking makes the link unavailable.
    await page.goto("/shares");
    await page
      .getByRole("button", { name: /^revoke$/i })
      .first()
      .click();
    await expect(page.getByText("revoked").first()).toBeVisible();
    await anonPage.getByRole("button", { name: /refresh/i }).click();
    await expect(anonPage.getByText(/not available/i)).toBeVisible();

    await context.close();
  });

  test("searches the library from the dialog and filters a list", async ({ page }) => {
    await signUp(page);

    // A library item and bag to find.
    await page.goto("/items");
    await page.getByRole("button", { name: /add item/i }).click();
    await page.getByLabel("Name").fill("Passport");
    await page.getByRole("button", { name: /^save$/i }).click();
    await expect(page.getByRole("dialog")).toBeHidden();

    await page.goto("/bags");
    await page.getByRole("button", { name: /add bag/i }).click();
    await page.getByLabel("Name").fill("Daypack");
    await page.getByRole("button", { name: /^save$/i }).click();
    await expect(page.getByRole("dialog")).toBeHidden();

    // The dialog searches real data and lands on the filtered list.
    await page.getByRole("button", { name: "Search" }).click();
    await page.getByPlaceholder("Search Pack Mate...").fill("pass");
    await expect(page.getByText("Passport")).toBeVisible();
    await page.getByText("Passport").click();
    await expect(page).toHaveURL(/\/items\?q=pass/);
    await expect(page.getByLabel("Search items")).toHaveValue("pass");
    await expect(page.getByText("Passport")).toBeVisible();

    // A list page filters by name and can be cleared.
    await page.goto("/bags?q=day");
    await expect(page.getByLabel("Search bags")).toHaveValue("day");
    await expect(page.getByText("Daypack")).toBeVisible();
    await page.getByRole("button", { name: /clear/i }).click();
    await expect(page.getByLabel("Search bags")).toHaveValue("");
  });
});
