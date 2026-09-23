import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
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
  await expect(page).toHaveURL(/\/dashboard$/);
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
  // The add dialog only closes once its RPC resolves, so wait for a previous
  // dialog to finish before clicking the trigger again; otherwise the overlay
  // swallows the click on a slow backend.
  await expect(page.getByRole("dialog")).toBeHidden();
  await page.getByRole("button", { name: /add to trip/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("tab", { name: tab }).click();
}

// Bulk pack/unpack live behind the header's "Bulk actions" menu so they are not
// triggered by accident.
async function bulkPack(page: Page, action: RegExp): Promise<void> {
  await page.getByRole("button", { name: /bulk actions/i }).click();
  await page.getByRole("menuitem", { name: action }).click();
}

async function createItem(page: Page, name: string): Promise<void> {
  await page.goto("/items");
  await page.getByRole("button", { name: /add item/i }).click();
  await page.getByLabel("Name").fill(name);
  await page.getByRole("button", { name: /^save$/i }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
}

async function createBag(page: Page, name: string, limit?: string): Promise<void> {
  await page.goto("/bags");
  await page.getByRole("button", { name: /add bag/i }).click();
  await page.getByLabel("Name").fill(name);
  if (limit) await page.getByLabel(/weight limit/i).fill(limit);
  await page.getByRole("button", { name: /^save$/i }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
}

async function createTrip(page: Page, name: string, country = "JP"): Promise<void> {
  await page.goto("/trips");
  await page.getByRole("button", { name: /new trip/i }).click();
  await page.getByLabel("Name").fill(name);
  await page.getByLabel("Country").selectOption(country);
  await page.getByRole("button", { name: /^save$/i }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
}

async function openTrip(page: Page, name = "Japan"): Promise<void> {
  await page.goto("/trips");
  await tripLink(page, name).click();
  await expect(page).toHaveURL(/\/trip\?id=/);
}

// A trip card shows the name both as a link and (when the destination is empty)
// as the country label, so match the name link exactly instead of by text.
function tripLink(page: Page, name: string) {
  return page.getByRole("link", { name, exact: true });
}

// Exports the current trip as a PDF and returns the downloaded bytes. The blank
// sheet is the dialog default, so only match mode needs an extra click.
async function exportPdf(
  page: Page,
  mode: "blank" | "packed" = "blank",
): Promise<{ bytes: Buffer; filename: string }> {
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: /download pdf/i }).click();
  if (mode === "packed") {
    await page.getByRole("radio", { name: /tick packed items/i }).click();
  }
  await page.getByRole("button", { name: /^download$/i }).click();
  const file = await download;
  const path = await file.path();
  if (!path) throw new Error("PDF export produced no file");
  return { bytes: await readFile(path), filename: file.suggestedFilename() };
}

test.describe("authenticated critical path", () => {
  test.skip(!enabled, "Set E2E_AUTH=1 to run authenticated flows against a live backend");

  test("sign up, create a trip, pack an item, delete the trip", async ({ page }) => {
    await signUp(page);

    // Create a trip.
    await createTrip(page, "Japan");
    await expect(tripLink(page, "Japan")).toBeVisible();

    // Open the trip and add a one-off item.
    await tripLink(page, "Japan").click();
    await expect(page).toHaveURL(/\/trip\?id=/);
    await openAddDialog(page, /one-off item/i);
    await page.getByLabel("Add a one-off item").fill("Passport");
    await page.getByRole("button", { name: /^add$/i }).click();
    await expect(
      page.getByRole("region", { name: "Not assigned" }).getByText("Passport"),
    ).toBeVisible();

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
    await expect(page.getByRole("link", { name: /^bag library$/i })).toBeVisible();
    await page.getByRole("link", { name: /shared links/i }).click();
    await expect(page).toHaveURL(/\/shares$/);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/trips");
    await page.getByRole("link", { name: /^items$/i }).click();
    await expect(page).toHaveURL(/\/items$/);
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
    await createTrip(page, "Japan");
    await tripLink(page, "Japan").click();
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
    await expect(page.getByText("2.00 kg").first()).toBeVisible();

    // Create a trip, add the bag, and put the item inside it.
    await createTrip(page, "Japan");
    await tripLink(page, "Japan").click();
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
    await createTrip(page, "Japan");
    await tripLink(page, "Japan").click();
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

    await createTrip(page, "Japan");
    await tripLink(page, "Japan").click();
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
    await createTrip(page, "Japan");
    await expect(tripLink(page, "Japan")).toBeVisible();
    await tripLink(page, "Japan").click();
    await expect(page).toHaveURL(/\/trip\?id=/);
    // Dev compiles /trip on demand; the URL updates before the route renders.
    await expect(page.getByRole("button", { name: /add to trip/i })).toBeVisible({
      timeout: 60_000,
    });
    await openAddDialog(page, /one-off item/i);
    await page.getByLabel("Add a one-off item").fill("Passport");
    await page.getByRole("button", { name: /^add$/i }).click();
    await expect(
      page.getByRole("region", { name: "Not assigned" }).getByText("Passport"),
    ).toBeVisible();

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

  test("items and bags can be created, edited and deleted", async ({ page }) => {
    await signUp(page);

    // An item can be created, renamed and deleted.
    await createItem(page, "Passport");
    await expect(page.getByText("Passport")).toBeVisible();
    await page.getByRole("button", { name: /^edit$/i }).click();
    await page.getByLabel("Name").fill("Passport copy");
    await page.getByRole("button", { name: /^save$/i }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByText("Passport copy")).toBeVisible();
    await page.getByRole("button", { name: /^delete$/i }).click();
    await page
      .getByRole("button", { name: /^delete$/i })
      .last()
      .click();
    await expect(page.getByText("Passport copy")).toHaveCount(0);

    // A bag can be created with a limit, renamed and given default contents.
    await createBag(page, "Main", "5");
    await expect(page.getByText(/limit 5\.00 kg/i)).toBeVisible();
    await page.getByRole("button", { name: /^edit$/i }).click();
    await page.getByLabel("Name").fill("Main bag");
    await page.getByRole("button", { name: /^save$/i }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByText("Main bag")).toBeVisible();

    await createItem(page, "Tent");
    await page.goto("/bags");
    await page.getByRole("button", { name: /contents/i }).click();
    await expect(page.getByText(/no default contents yet/i)).toBeVisible();
    await page.getByLabel("Item").click();
    await page.getByLabel("Search options").fill("tent");
    await page.getByRole("option", { name: "Tent" }).first().click();
    await page.getByRole("button", { name: /^add$/i }).click();
    // The picker keeps "Tent" in its own control, so assert on the contents row
    // (identifiable by its Remove action) rather than the item name alone.
    await expect(page.getByRole("dialog").getByRole("button", { name: /^remove$/i })).toBeVisible();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: /^remove$/i })
      .click();
    await expect(page.getByText(/no default contents yet/i)).toBeVisible();
    await page.getByRole("button", { name: "Close" }).click();

    // The bag can be deleted.
    await page.getByRole("button", { name: /^delete$/i }).click();
    await page
      .getByRole("button", { name: /^delete$/i })
      .last()
      .click();
    await expect(page.getByText("Main bag")).toHaveCount(0);
  });

  test("trips can be edited and shared links copied, regenerated and revoked", async ({ page }) => {
    await signUp(page);

    // A trip can be renamed.
    await createTrip(page, "Japan");
    await expect(tripLink(page, "Japan")).toBeVisible();
    await page.getByRole("button", { name: /^edit$/i }).click();
    await page.getByLabel("Name").fill("Japan 2026");
    await page.getByRole("button", { name: /^save$/i }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(tripLink(page, "Japan 2026")).toBeVisible();

    // Publish a link, then manage it from the shared links surface.
    await tripLink(page, "Japan 2026").click();
    await expect(page).toHaveURL(/\/trip\?id=/);
    await page.getByRole("button", { name: /^share$/i }).click();
    await page.getByRole("button", { name: /create link/i }).click();
    expect(await page.getByLabel("Link").inputValue()).toContain("/share?t=");
    await page.getByRole("button", { name: /^done$/i }).click();

    await page.goto("/shares");
    await expect(page.getByText("Japan 2026")).toBeVisible();

    await page.getByRole("button", { name: /^copy$/i }).click();
    await expect(page.getByText(/link copied/i)).toBeVisible();

    await page.getByRole("button", { name: /^regenerate$/i }).click();
    await expect(page.getByText(/new link created/i)).toBeVisible();

    // Regenerating revokes the old link but keeps it listed, so revoke the one
    // that is still active rather than whichever row happens to match first.
    await page
      .getByRole("row")
      .filter({ hasText: /active/i })
      .getByRole("button", { name: /^revoke$/i })
      .click();
    await expect(page.getByText("revoked").first()).toBeVisible();
  });

  test("trip entries can be added, reassigned, packed, reordered and removed", async ({ page }) => {
    await signUp(page);

    await createItem(page, "Tent");
    await createBag(page, "Main");
    await createTrip(page, "Japan");
    await openTrip(page);

    // Add a library bag, then a library item into it.
    await openAddDialog(page, /library bag/i);
    await pickLibraryOption(page, "Add a bag from your library", "Main");
    await page.getByRole("button", { name: /^add bag$/i }).click();
    await expect(page.getByRole("region", { name: "Main" })).toBeVisible();

    await openAddDialog(page, /library item/i);
    await pickLibraryOption(page, "Add an item from your library", "Tent");
    await page.getByLabel("Destination for library item").selectOption({ label: "Main" });
    await page.getByRole("button", { name: /^add item$/i }).click();
    await expect(page.getByLabel("Quantity for Tent")).toBeVisible();

    // Add two one-off items to the unassigned group.
    for (const name of ["Passport", "Adapter"]) {
      await openAddDialog(page, /one-off item/i);
      await page.getByLabel("Add a one-off item").fill(name);
      await page.getByRole("button", { name: /^add$/i }).click();
      await expect(page.getByLabel(`Quantity for ${name}`)).toBeVisible();
    }

    // Reorder the unassigned entries by dragging a row.
    const loose = page.getByRole("region", { name: "Not assigned" });
    const labels = () =>
      loose
        .getByLabel(/^Quantity for/)
        .evaluateAll((elements) => elements.map((element) => element.getAttribute("aria-label")));
    const orderBefore = await labels();
    const handles = loose.getByLabel("Reorder");
    await handles.nth(1).scrollIntoViewIfNeeded();
    await handles.nth(1).hover();
    const firstBox = await handles.first().boundingBox();
    const secondBox = await handles.nth(1).boundingBox();
    if (!firstBox || !secondBox) throw new Error("Reorder handle not visible");
    await page.mouse.down();
    // dnd-kit needs to clear its activation distance before tracking the move.
    await page.mouse.move(secondBox.x + secondBox.width / 2, secondBox.y - 20, { steps: 5 });
    await page.mouse.move(firstBox.x + firstBox.width / 2, firstBox.y - firstBox.height / 2, {
      steps: 10,
    });
    await page.mouse.up();
    await expect.poll(labels).not.toEqual(orderBefore);

    // Change a quantity.
    const qty = page.getByLabel("Quantity for Passport");
    await qty.fill("3");
    await qty.blur();
    await expect(qty).toHaveValue("3");

    // Mark the entry With Me.
    const passportRow = qty.locator("..");
    await passportRow.getByLabel("Location").selectOption("with_me");
    await expect(page.getByRole("region", { name: "With Me" }).getByText("Passport")).toBeVisible();

    // Pack it.
    await passportRow.getByRole("checkbox").click();
    await expect(page.getByRole("checkbox", { name: /mark unpacked/i })).toBeVisible();

    // Remove the other entry.
    const adapterRow = page.getByLabel("Quantity for Adapter").locator("..");
    await adapterRow.getByRole("button", { name: /^remove$/i }).click();
    await expect(page.getByLabel("Quantity for Adapter")).toHaveCount(0);
  });

  test("exports a trip's packing list as a printable PDF", async ({ page }) => {
    await signUp(page);
    await createTrip(page, "Japan");
    await openTrip(page, "Japan");

    await openAddDialog(page, /one-off item/i);
    await page.getByLabel("Add a one-off item").fill("Passport");
    await page.getByRole("button", { name: /^add$/i }).click();
    await expect(
      page.getByRole("region", { name: "Not assigned" }).getByText("Passport"),
    ).toBeVisible();

    const { bytes, filename } = await exportPdf(page);

    expect(filename).toMatch(/pack-mate-japan.*\.pdf/i);
    expect(bytes.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });

  test("PDF match mode reflects packed state", async ({ page }) => {
    await signUp(page);

    // A trip with a packed entry: the ticked sheet differs from the blank one.
    await createTrip(page, "Japan");
    await openTrip(page, "Japan");
    await openAddDialog(page, /one-off item/i);
    await page.getByLabel("Add a one-off item").fill("Passport");
    await page.getByRole("button", { name: /^add$/i }).click();
    await page.getByRole("checkbox", { name: /mark packed/i }).click();

    const packedTripBlank = await exportPdf(page, "blank");
    const packedTripMatch = await exportPdf(page, "packed");
    expect(packedTripMatch.bytes.length).not.toBe(packedTripBlank.bytes.length);

    // A trip with nothing packed: both modes produce the same sheet.
    await createTrip(page, "Norway", "NO");
    await openTrip(page, "Norway");
    await openAddDialog(page, /one-off item/i);
    await page.getByLabel("Add a one-off item").fill("Tent");
    await page.getByRole("button", { name: /^add$/i }).click();

    const looseBlank = await exportPdf(page, "blank");
    const looseMatch = await exportPdf(page, "packed");
    expect(looseMatch.bytes.length).toBe(looseBlank.bytes.length);
  });

  test("edits a trip from its own page", async ({ page }) => {
    await signUp(page);
    await createTrip(page, "Japan");
    await openTrip(page, "Japan");

    await page.getByRole("button", { name: /edit trip/i }).click();
    await page.getByLabel("Name").fill("Japan 2026");
    await page.getByLabel("Destination").fill("Osaka");
    await page.getByRole("button", { name: /save changes/i }).click();

    await expect(page.getByRole("heading", { name: "Japan 2026" })).toBeVisible();
    await expect(page.getByText("Osaka, Japan")).toBeVisible();
  });

  test("duplicates a trip's packing list into a new trip", async ({ page }) => {
    await signUp(page);

    // A trip with one item, packed.
    await createTrip(page, "Japan");

    await openTrip(page, "Japan");
    await openAddDialog(page, /one-off item/i);
    await page.getByLabel("Add a one-off item").fill("Passport");
    await page.getByRole("button", { name: /^add$/i }).click();
    await expect(
      page.getByRole("region", { name: "Not assigned" }).getByText("Passport"),
    ).toBeVisible();
    await page.getByRole("checkbox", { name: /mark packed/i }).click();
    await expect(page.getByText(/1\/1 packed/i).first()).toBeVisible();

    // Duplicate from the header: fields prefilled, dates cleared.
    await page.getByRole("button", { name: /^duplicate$/i }).click();
    await expect(page.getByLabel("Name")).toHaveValue("Japan (copy)");
    await expect(page.getByLabel("Country")).toHaveValue("JP");
    await expect(page.getByLabel("Start date")).toHaveValue("");
    await page.getByLabel("Name").fill("Japan 2027");
    await page.getByLabel("Start date").fill("2027-03-01");
    await page.getByLabel("End date").fill("2027-03-10");
    await page.getByRole("button", { name: /create copy/i }).click();

    // The copy lands open with the same item, unpacked, and the new fields.
    await expect(page).toHaveURL(/\/trip\?id=/);
    await expect(page.getByRole("heading", { name: "Japan 2027" })).toBeVisible();
    // The header surfaces the trip's own dates and countdown.
    await expect(page.getByText("1 Mar 2027 – 10 Mar 2027")).toBeVisible();
    await expect(page.getByText(/10 days \(9 nights\)/)).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Not assigned" }).getByText("Passport"),
    ).toBeVisible();
    await expect(page.getByText(/0\/1 packed/i).first()).toBeVisible();
  });

  test("packs all entries, undoes, and unpacks all", async ({ page }) => {
    await signUp(page);

    // A trip with two items.
    await createTrip(page, "Japan");

    await openTrip(page, "Japan");
    for (const name of ["Passport", "Adapter"]) {
      await openAddDialog(page, /one-off item/i);
      await page.getByLabel("Add a one-off item").fill(name);
      await page.getByRole("button", { name: /^add$/i }).click();
      await expect(page.getByLabel(`Quantity for ${name}`)).toBeVisible();
    }

    // Pack all in one action.
    await bulkPack(page, /^pack all/i);
    await expect(page.getByText(/2\/2 packed/i).first()).toBeVisible();

    // Undo restores the previous (unpacked) state.
    await page.getByRole("button", { name: /^undo$/i }).click();
    await expect(page.getByText(/0\/2 packed/i).first()).toBeVisible();

    // Pack again, then unpack all.
    await bulkPack(page, /^pack all/i);
    await expect(page.getByText(/2\/2 packed/i).first()).toBeVisible();
    await bulkPack(page, /^unpack all/i);
    await expect(page.getByText(/0\/2 packed/i).first()).toBeVisible();
  });

  test("every surface is usable at mobile and desktop widths", async ({ page }) => {
    await signUp(page);

    // Seed a library and a trip with content so each surface has records.
    await createItem(page, "Passport");
    await createBag(page, "Main", "5");
    await createTrip(page, "Japan");
    await openTrip(page);
    await openAddDialog(page, /library bag/i);
    await pickLibraryOption(page, "Add a bag from your library", "Main");
    await page.getByRole("button", { name: /^add bag$/i }).click();
    await openAddDialog(page, /one-off item/i);
    await page.getByLabel("Add a one-off item").fill("Adapter");
    await page.getByRole("button", { name: /^add$/i }).click();
    await expect(page.getByText("Adapter")).toBeVisible();

    // Publish a link so the public surface has content too.
    await page.getByRole("button", { name: /^share$/i }).click();
    await page.getByRole("button", { name: /create link/i }).click();
    const shareUrl = await page.getByLabel("Link").inputValue();
    await page.getByRole("button", { name: /^done$/i }).click();
    const tripUrl = page.url();

    for (const width of [390, 1280]) {
      await page.setViewportSize({ width, height: 800 });
      const surfaces: { path: string; assert: () => Promise<unknown> }[] = [
        {
          path: "/trips",
          assert: () => expect(page.getByRole("button", { name: /new trip/i })).toBeVisible(),
        },
        {
          path: "/bags",
          assert: () => expect(page.getByRole("button", { name: /add bag/i })).toBeVisible(),
        },
        {
          path: "/items",
          assert: () => expect(page.getByRole("button", { name: /add item/i })).toBeVisible(),
        },
        {
          path: "/shares",
          assert: () => expect(page.getByRole("heading", { name: /shared links/i })).toBeVisible(),
        },
        { path: "/account", assert: () => expect(page.getByText(/personal info/i)).toBeVisible() },
        {
          path: tripUrl,
          assert: () => expect(page.getByRole("button", { name: /add to trip/i })).toBeVisible(),
        },
        {
          path: shareUrl,
          assert: () =>
            expect(page.getByRole("link", { name: /create your own list/i })).toBeVisible(),
        },
      ];

      for (const surface of surfaces) {
        await page.goto(surface.path);
        await surface.assert();
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        );
        expect(overflow, `${surface.path} at ${width}px`).toBeLessThanOrEqual(1);
      }

      // The PDF export dialog must not overflow either.
      await page.goto(tripUrl);
      await page.getByRole("button", { name: /download pdf/i }).click();
      const dialogOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(dialogOverflow, `pdf dialog at ${width}px`).toBeLessThanOrEqual(1);
      await page.getByRole("button", { name: /cancel/i }).click();
    }
  });
});
