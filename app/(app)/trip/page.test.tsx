import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Trip, TripBag, TripEntry } from "@/lib/types";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("id=t1"),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/lib/data", () => ({
  getTrip: vi.fn(),
  listTripBags: vi.fn(),
  listTripEntries: vi.fn(),
  listBags: vi.fn(),
  listItems: vi.fn(),
  getProfile: vi.fn(),
  addLibraryBagToTrip: vi.fn(),
  addLibraryItemToTrip: vi.fn(),
  addAdHocEntry: vi.fn(),
  deleteEntry: vi.fn(),
  reorderEntries: vi.fn(),
  setBagParent: vi.fn(),
  setEntryLocation: vi.fn(),
  updateEntry: vi.fn(),
  createShareLink: vi.fn(),
  getActiveShareLink: vi.fn(),
  regenerateShareLink: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import * as data from "@/lib/data";
import { TripView } from "./page";

const trip: Trip = {
  id: "t1",
  user_id: "u1",
  name: "Japan",
  start_date: null,
  end_date: null,
  created_at: "2026-01-01T00:00:00Z",
};

const bag: TripBag = {
  id: "b1",
  trip_id: "t1",
  name: "Electronics",
  source_bag_id: null,
  position: 0,
  weight_limit_grams: null,
  parent_bag_id: null,
};

function entry(partial: Partial<TripEntry> & { id: string }): TripEntry {
  return {
    trip_id: "t1",
    trip_bag_id: null,
    name: "Item",
    qty: 1,
    source_item_id: null,
    is_with_me: false,
    is_packed: false,
    position: 0,
    description: null,
    link: null,
    image_url: null,
    weight_grams: null,
    category: null,
    ...partial,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(data.listBags).mockResolvedValue([]);
  vi.mocked(data.listItems).mockResolvedValue([]);
  vi.mocked(data.getProfile).mockResolvedValue(null);
});

function bagCard(name: string): HTMLElement {
  const title = screen.getByText(name, { selector: '[data-slot="card-title"]' });
  return title.closest('[data-slot="card"]') as HTMLElement;
}

describe("TripView", () => {
  it("groups entries by bag, With Me and loose, and shows progress", async () => {
    vi.mocked(data.getTrip).mockResolvedValue(trip);
    vi.mocked(data.listTripBags).mockResolvedValue([bag]);
    vi.mocked(data.listTripEntries).mockResolvedValue([
      entry({ id: "e1", trip_bag_id: "b1", name: "Charger" }),
      entry({ id: "e2", is_with_me: true, name: "Passport" }),
      entry({ id: "e3", name: "Adapter" }),
    ]);
    render(<TripView />);

    expect(await screen.findByText("Charger")).toBeInTheDocument();
    expect(screen.getByText("Passport")).toBeInTheDocument();
    expect(screen.getByText("Adapter")).toBeInTheDocument();
    expect(screen.getAllByText("Electronics").length).toBeGreaterThan(0);
    expect(screen.getAllByText("With Me").length).toBeGreaterThan(0);
    expect(screen.getByText("Not assigned")).toBeInTheDocument();
    expect(screen.getByText(/0\/3 packed/i)).toBeInTheDocument();
  });

  it("marks an entry packed", async () => {
    vi.mocked(data.getTrip).mockResolvedValue(trip);
    vi.mocked(data.listTripBags).mockResolvedValue([]);
    vi.mocked(data.listTripEntries).mockResolvedValue([entry({ id: "e1", name: "Passport" })]);
    vi.mocked(data.updateEntry).mockResolvedValue(
      entry({ id: "e1", name: "Passport", is_packed: true }),
    );
    const user = userEvent.setup();
    render(<TripView />);
    await screen.findByText("Passport");

    await user.click(screen.getByRole("checkbox", { name: /mark packed/i }));
    await waitFor(() => expect(data.updateEntry).toHaveBeenCalledWith("e1", { is_packed: true }));
  });

  it("adds a one-off item to the loose group", async () => {
    vi.mocked(data.getTrip).mockResolvedValue(trip);
    vi.mocked(data.listTripBags).mockResolvedValue([]);
    vi.mocked(data.listTripEntries).mockResolvedValue([]);
    vi.mocked(data.addAdHocEntry).mockResolvedValue(entry({ id: "e1", name: "Adapter" }));
    const user = userEvent.setup();
    render(<TripView />);
    await screen.findByLabelText("Add a one-off item");

    await user.type(screen.getByLabelText("Add a one-off item"), "Adapter");
    await user.click(screen.getByRole("button", { name: /^add$/i }));

    await waitFor(() =>
      expect(data.addAdHocEntry).toHaveBeenCalledWith({
        tripId: "t1",
        name: "Adapter",
        qty: 1,
        tripBagId: null,
      }),
    );
  });

  it("shows an empty state when the list has no entries", async () => {
    vi.mocked(data.getTrip).mockResolvedValue(trip);
    vi.mocked(data.listTripBags).mockResolvedValue([]);
    vi.mocked(data.listTripEntries).mockResolvedValue([]);
    render(<TripView />);
    expect(await screen.findByText(/nothing on this list yet/i)).toBeInTheDocument();
  });

  it("updates an entry quantity", async () => {
    vi.mocked(data.getTrip).mockResolvedValue(trip);
    vi.mocked(data.listTripBags).mockResolvedValue([]);
    vi.mocked(data.listTripEntries).mockResolvedValue([entry({ id: "e1", name: "Socks", qty: 2 })]);
    vi.mocked(data.updateEntry).mockResolvedValue(entry({ id: "e1", name: "Socks", qty: 5 }));
    const user = userEvent.setup();
    render(<TripView />);
    await screen.findByText("Socks");

    const qty = screen.getByLabelText("Quantity for Socks");
    await user.clear(qty);
    await user.type(qty, "5");
    await user.tab();

    await waitFor(() => expect(data.updateEntry).toHaveBeenCalledWith("e1", { qty: 5 }));
  });

  it("finds an entry by name and shows where it is", async () => {
    vi.mocked(data.getTrip).mockResolvedValue(trip);
    vi.mocked(data.listTripBags).mockResolvedValue([bag]);
    vi.mocked(data.listTripEntries).mockResolvedValue([
      entry({ id: "e1", trip_bag_id: "b1", name: "Charger" }),
      entry({ id: "e2", is_with_me: true, name: "Passport" }),
    ]);
    const user = userEvent.setup();
    render(<TripView />);
    await screen.findByText("Charger");

    await user.type(screen.getByLabelText("Search items"), "pass");

    expect(await screen.findByText("1 match")).toBeInTheDocument();
    const passport = screen.getByText("Passport");
    expect(passport).toBeInTheDocument();
    expect(passport.parentElement?.textContent).toContain("With Me");
  });

  it("shows an empty state when nothing matches the search", async () => {
    vi.mocked(data.getTrip).mockResolvedValue(trip);
    vi.mocked(data.listTripBags).mockResolvedValue([]);
    vi.mocked(data.listTripEntries).mockResolvedValue([entry({ id: "e1", name: "Charger" })]);
    const user = userEvent.setup();
    render(<TripView />);
    await screen.findByText("Charger");

    await user.type(screen.getByLabelText("Search items"), "tent");

    expect(await screen.findByText(/no items match/i)).toBeInTheDocument();
  });

  it("clears the search and returns to the list", async () => {
    vi.mocked(data.getTrip).mockResolvedValue(trip);
    vi.mocked(data.listTripBags).mockResolvedValue([]);
    vi.mocked(data.listTripEntries).mockResolvedValue([entry({ id: "e1", name: "Charger" })]);
    const user = userEvent.setup();
    render(<TripView />);
    await screen.findByText("Charger");

    await user.type(screen.getByLabelText("Search items"), "charger");
    expect(await screen.findByText("1 match")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^clear$/i }));

    expect(await screen.findByText(/not assigned/i)).toBeInTheDocument();
  });

  it("expands an entry to show its details", async () => {
    vi.mocked(data.getTrip).mockResolvedValue(trip);
    vi.mocked(data.listTripBags).mockResolvedValue([]);
    vi.mocked(data.listTripEntries).mockResolvedValue([
      entry({
        id: "e1",
        name: "Charger",
        description: "USB-C, 65W",
        link: "https://example.com/charger",
        image_url: "https://example.com/charger.jpg",
      }),
    ]);
    const user = userEvent.setup();
    render(<TripView />);
    await screen.findByText("Charger");

    await user.click(screen.getByRole("button", { name: /show details for charger/i }));

    expect(screen.getByText("USB-C, 65W")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /example\.com\/charger$/ })).toBeInTheDocument();
    expect(screen.getByAltText("Charger")).toBeInTheDocument();
  });

  it("edits an entry's details", async () => {
    vi.mocked(data.getTrip).mockResolvedValue(trip);
    vi.mocked(data.listTripBags).mockResolvedValue([]);
    vi.mocked(data.listTripEntries).mockResolvedValue([entry({ id: "e1", name: "Charger" })]);
    vi.mocked(data.updateEntry).mockResolvedValue(
      entry({ id: "e1", name: "Charger", description: "USB-C, 65W" }),
    );
    const user = userEvent.setup();
    render(<TripView />);
    await screen.findByText("Charger");

    await user.click(screen.getByRole("button", { name: /^edit$/i }));
    await user.type(await screen.findByLabelText("Description"), "USB-C, 65W");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() =>
      expect(data.updateEntry).toHaveBeenCalledWith("e1", {
        description: "USB-C, 65W",
        link: null,
        image_url: null,
        category: null,
      }),
    );
  });

  it("shows a bag's weight against its limit and the trip total", async () => {
    vi.mocked(data.getTrip).mockResolvedValue(trip);
    vi.mocked(data.listTripBags).mockResolvedValue([{ ...bag, weight_limit_grams: 23000 }]);
    vi.mocked(data.listTripEntries).mockResolvedValue([
      entry({ id: "e1", trip_bag_id: "b1", name: "Charger", weight_grams: 18000 }),
    ]);
    render(<TripView />);

    expect(await screen.findByText("18.00 kg / 23.00 kg · under limit")).toBeInTheDocument();
    expect(screen.getByText(/total 18\.00 kg/i)).toBeInTheDocument();
  });

  it("shows a bag as over its limit", async () => {
    vi.mocked(data.getTrip).mockResolvedValue(trip);
    vi.mocked(data.listTripBags).mockResolvedValue([{ ...bag, weight_limit_grams: 1000 }]);
    vi.mocked(data.listTripEntries).mockResolvedValue([
      entry({ id: "e1", trip_bag_id: "b1", name: "Charger", weight_grams: 2000 }),
    ]);
    render(<TripView />);

    expect(await screen.findByText("2.00 kg / 1.00 kg · over limit")).toBeInTheDocument();
  });

  it("marks a bag weight incomplete when an entry has no weight", async () => {
    vi.mocked(data.getTrip).mockResolvedValue(trip);
    vi.mocked(data.listTripBags).mockResolvedValue([bag]);
    vi.mocked(data.listTripEntries).mockResolvedValue([
      entry({ id: "e1", trip_bag_id: "b1", name: "Charger", weight_grams: 1000 }),
      entry({ id: "e2", trip_bag_id: "b1", name: "Cable" }),
    ]);
    render(<TripView />);
    await screen.findByText("Charger");

    const card = bagCard("Electronics");
    expect(await within(card).findByText("1.00 kg (incomplete)")).toBeInTheDocument();
  });

  it("switches the displayed weight unit without changing the preference", async () => {
    vi.mocked(data.getTrip).mockResolvedValue(trip);
    vi.mocked(data.listTripBags).mockResolvedValue([bag]);
    vi.mocked(data.listTripEntries).mockResolvedValue([
      entry({ id: "e1", trip_bag_id: "b1", name: "Charger", weight_grams: 1000 }),
    ]);
    const user = userEvent.setup();
    render(<TripView />);
    await screen.findByText("Charger");
    const card = bagCard("Electronics");
    await within(card).findByText("1.00 kg");

    await user.click(screen.getByRole("button", { name: /switch weight unit/i }));

    expect(await within(card).findByText("2.20 lb")).toBeInTheDocument();
  });

  const suitcase: TripBag = { ...bag, id: "b1", name: "Suitcase", parent_bag_id: null };
  const toiletry: TripBag = { ...bag, id: "b2", name: "Toiletry", parent_bag_id: "b1" };

  it("shows a nested bag under its parent with the full location path", async () => {
    vi.mocked(data.getTrip).mockResolvedValue(trip);
    vi.mocked(data.listTripBags).mockResolvedValue([suitcase, toiletry]);
    vi.mocked(data.listTripEntries).mockResolvedValue([
      entry({ id: "e1", trip_bag_id: "b2", name: "Toothbrush" }),
    ]);
    render(<TripView />);

    expect(await screen.findByText("Toothbrush")).toBeInTheDocument();
    expect(screen.getByLabelText("Parent bag for Toiletry")).toHaveValue("b1");
    expect(screen.getByText("Suitcase > Toiletry")).toBeInTheDocument();
  });

  it("moves a bag into another bag", async () => {
    vi.mocked(data.getTrip).mockResolvedValue(trip);
    vi.mocked(data.listTripBags).mockResolvedValue([
      suitcase,
      { ...toiletry, parent_bag_id: null },
    ]);
    vi.mocked(data.listTripEntries).mockResolvedValue([
      entry({ id: "e1", trip_bag_id: "b2", name: "Toothbrush" }),
    ]);
    vi.mocked(data.setBagParent).mockResolvedValue(toiletry);
    const user = userEvent.setup();
    render(<TripView />);
    await screen.findByLabelText("Parent bag for Toiletry");

    await user.selectOptions(screen.getByLabelText("Parent bag for Toiletry"), "b1");

    await waitFor(() =>
      expect(data.setBagParent).toHaveBeenCalledWith(
        expect.objectContaining({ id: "b2" }),
        expect.objectContaining({ id: "b1" }),
      ),
    );
  });

  it("moves a nested bag back to the top level", async () => {
    vi.mocked(data.getTrip).mockResolvedValue(trip);
    vi.mocked(data.listTripBags).mockResolvedValue([suitcase, toiletry]);
    vi.mocked(data.listTripEntries).mockResolvedValue([
      entry({ id: "e1", trip_bag_id: "b2", name: "Toothbrush" }),
    ]);
    vi.mocked(data.setBagParent).mockResolvedValue({ ...toiletry, parent_bag_id: null });
    const user = userEvent.setup();
    render(<TripView />);
    await screen.findByLabelText("Parent bag for Toiletry");

    await user.selectOptions(screen.getByLabelText("Parent bag for Toiletry"), "");

    await waitFor(() =>
      expect(data.setBagParent).toHaveBeenCalledWith(expect.objectContaining({ id: "b2" }), null),
    );
  });

  it("shows the full location path in search results", async () => {
    vi.mocked(data.getTrip).mockResolvedValue(trip);
    vi.mocked(data.listTripBags).mockResolvedValue([suitcase, toiletry]);
    vi.mocked(data.listTripEntries).mockResolvedValue([
      entry({ id: "e1", trip_bag_id: "b2", name: "Toothbrush" }),
    ]);
    const user = userEvent.setup();
    render(<TripView />);
    await screen.findByText("Toothbrush");

    await user.type(screen.getByLabelText("Search items"), "tooth");

    expect(await screen.findByText("1 match")).toBeInTheDocument();
    expect(screen.getAllByText("Suitcase > Toiletry").length).toBeGreaterThan(0);
  });

  it("creates and copies a share link from the trip", async () => {
    const token = "a".repeat(64);
    vi.mocked(data.getTrip).mockResolvedValue(trip);
    vi.mocked(data.listTripBags).mockResolvedValue([]);
    vi.mocked(data.listTripEntries).mockResolvedValue([]);
    vi.mocked(data.getActiveShareLink).mockResolvedValue(null);
    vi.mocked(data.createShareLink).mockResolvedValue({
      id: "s1",
      trip_id: "t1",
      user_id: "u1",
      token,
      created_at: "2026-09-14T00:00:00.000Z",
      expires_at: null,
      revoked_at: null,
    });
    const user = userEvent.setup();
    render(<TripView />);
    await screen.findByRole("button", { name: /^share$/i });

    await user.click(screen.getByRole("button", { name: /^share$/i }));
    await user.click(await screen.findByRole("button", { name: /create link/i }));

    expect(await screen.findByLabelText("Link")).toHaveValue(
      `http://localhost:3000/share?t=${token}`,
    );
    expect(data.createShareLink).toHaveBeenCalledWith("t1", null);

    await user.click(screen.getByRole("button", { name: /copy link/i }));
    await waitFor(async () => {
      expect(await navigator.clipboard.readText()).toContain(`/share?t=${token}`);
    });
  });

  it("shows a category badge on a trip entry", async () => {
    vi.mocked(data.getTrip).mockResolvedValue(trip);
    vi.mocked(data.listTripBags).mockResolvedValue([]);
    vi.mocked(data.listTripEntries).mockResolvedValue([
      entry({ id: "e1", name: "Tee", category: "clothing" }),
    ]);
    render(<TripView />);
    await screen.findByText("Tee");

    const entryElement = screen.getByText("Tee").closest("div.rounded-md") as HTMLElement;
    expect(within(entryElement).getByText("Clothing")).toBeInTheDocument();
  });

  it("filters entries by category across locations and clears the filter", async () => {
    vi.mocked(data.getTrip).mockResolvedValue(trip);
    vi.mocked(data.listTripBags).mockResolvedValue([bag]);
    vi.mocked(data.listTripEntries).mockResolvedValue([
      entry({ id: "e1", name: "Tee", category: "clothing" }),
      entry({ id: "e2", trip_bag_id: "b1", name: "Charger", category: "electronics" }),
      entry({ id: "e3", is_with_me: true, name: "Passport", category: "documents" }),
    ]);
    const user = userEvent.setup();
    render(<TripView />);
    await screen.findByText("Tee");

    await user.click(screen.getByRole("button", { name: "Clothing" }));

    expect(screen.getByText("Tee")).toBeInTheDocument();
    expect(screen.queryByText("Charger")).not.toBeInTheDocument();
    expect(screen.queryByText("Passport")).not.toBeInTheDocument();
    expect(screen.getByText("Not assigned")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "All" }));

    expect(screen.getByText("Charger")).toBeInTheDocument();
    expect(screen.getByText("Passport")).toBeInTheDocument();
  });

  it("shows an empty state when the filtered category has no entries", async () => {
    const tee = entry({ id: "e1", name: "Tee", category: "clothing" });
    const charger = entry({ id: "e2", name: "Charger", category: "electronics" });
    vi.mocked(data.getTrip).mockResolvedValue(trip);
    vi.mocked(data.listTripBags).mockResolvedValue([]);
    vi.mocked(data.listTripEntries)
      .mockResolvedValueOnce([tee, charger])
      .mockResolvedValue([charger]);
    vi.mocked(data.deleteEntry).mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<TripView />);
    await screen.findByText("Tee");

    await user.click(screen.getByRole("button", { name: "Clothing" }));
    expect(screen.queryByText("Charger")).not.toBeInTheDocument();

    const entryElement = screen.getByText("Tee").closest("div.rounded-md") as HTMLElement;
    await user.click(within(entryElement).getByRole("button", { name: /remove/i }));

    expect(await screen.findByText(/no entries in this category/i)).toBeInTheDocument();
  });

  it("shows a weight-by-category breakdown over the whole list", async () => {
    vi.mocked(data.getTrip).mockResolvedValue(trip);
    vi.mocked(data.listTripBags).mockResolvedValue([bag]);
    vi.mocked(data.listTripEntries).mockResolvedValue([
      entry({ id: "e1", name: "Tee", category: "clothing", weight_grams: 1000 }),
      entry({
        id: "e2",
        trip_bag_id: "b1",
        name: "Charger",
        category: "electronics",
        weight_grams: 500,
      }),
      entry({
        id: "e3",
        is_with_me: true,
        name: "Passport",
        category: "documents",
        weight_grams: 30,
      }),
      entry({ id: "e4", name: "Adapter" }),
    ]);
    render(<TripView />);

    const heading = await screen.findByText("Weight by category");
    const card = heading.closest('[data-slot="card"]') as HTMLElement;
    expect(within(card).getByText("Clothing")).toBeInTheDocument();
    expect(within(card).getByText("1.00 kg")).toBeInTheDocument();
    expect(within(card).getByText("0.50 kg")).toBeInTheDocument();
    expect(within(card).getByText("0.03 kg")).toBeInTheDocument();
    expect(within(card).getByText("Uncategorised")).toBeInTheDocument();
    expect(within(card).getByText(/0\.00 kg \(incomplete\)/)).toBeInTheDocument();
  });
});
