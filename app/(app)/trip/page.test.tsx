import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReusableBag, ReusableItem, Trip, TripBag, TripEntry } from "@/lib/types";

const router = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("id=t1"),
  useRouter: () => router,
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
  getDestinationFacts: vi.fn(),
  listSuggestionDismissals: vi.fn(),
  dismissSuggestion: vi.fn(),
  duplicateTrip: vi.fn(),
  setTripPacked: vi.fn(),
}));

vi.mock("@/lib/suggestions", () => ({
  getTripSuggestions: vi.fn().mockResolvedValue([]),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { toast } from "sonner";
import * as data from "@/lib/data";
import { TripView } from "./page";

const trip: Trip = {
  id: "t1",
  user_id: "u1",
  name: "Japan",
  destination: "Kyoto",
  country_code: "JP",
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
  icon: null,
};

const libraryBag: ReusableBag = {
  id: "lb1",
  user_id: "u1",
  name: "Main backpack",
  weight_limit_grams: null,
  icon: null,
  created_at: "2026-01-01T00:00:00Z",
};

const libraryItem: ReusableItem = {
  id: "li1",
  user_id: "u1",
  name: "Passport",
  default_qty: 2,
  description: null,
  link: null,
  image_url: null,
  weight_grams: null,
  category: "documents",
  created_at: "2026-01-01T00:00:00Z",
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
  vi.mocked(data.getDestinationFacts).mockResolvedValue(null);
});

function bagCard(name: string): HTMLElement {
  return screen.getByRole("region", { name });
}

async function openAddDialog(user: ReturnType<typeof userEvent.setup>, tab: RegExp) {
  await user.click(await screen.findByRole("button", { name: /add to trip/i }));
  await user.click(await screen.findByRole("tab", { name: tab }));
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

  it("shows the destination and country name in the header, never the raw code", async () => {
    vi.mocked(data.getTrip).mockResolvedValue(trip);
    vi.mocked(data.listTripBags).mockResolvedValue([]);
    vi.mocked(data.listTripEntries).mockResolvedValue([]);
    render(<TripView />);

    expect(await screen.findByText("Kyoto, Japan")).toBeInTheDocument();
    expect(screen.queryByText("JP")).not.toBeInTheDocument();
  });

  it("shows destination facts for the trip's country", async () => {
    vi.mocked(data.getTrip).mockResolvedValue(trip);
    vi.mocked(data.listTripBags).mockResolvedValue([]);
    vi.mocked(data.listTripEntries).mockResolvedValue([]);
    vi.mocked(data.getDestinationFacts).mockResolvedValue({
      country_code: "JP",
      currency_code: "JPY",
      calling_code: "+81",
      plug_types: ["A", "B"],
      voltage: "100",
      frequency: "50/60",
      timezones: ["Asia/Tokyo"],
      updated_at: "2026-01-01T00:00:00Z",
    });
    render(<TripView />);

    expect(await screen.findByText("Destination info")).toBeInTheDocument();
    expect(screen.getByAltText("Type A plug")).toBeInTheDocument();
    expect(screen.getByText("JPY ¥")).toBeInTheDocument();
    expect(screen.getByText("+81")).toBeInTheDocument();
  });

  it("keeps the packing list usable when destination facts fail to load", async () => {
    vi.mocked(data.getTrip).mockResolvedValue(trip);
    vi.mocked(data.listTripBags).mockResolvedValue([]);
    vi.mocked(data.listTripEntries).mockResolvedValue([entry({ id: "e1", name: "Passport" })]);
    vi.mocked(data.getDestinationFacts).mockRejectedValue(new Error("offline"));
    render(<TripView />);

    expect(await screen.findByText("Passport")).toBeInTheDocument();
    expect(screen.queryByText("Destination info")).not.toBeInTheDocument();
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
    await openAddDialog(user, /one-off item/i);

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

  it("adds a library bag chosen from the picker", async () => {
    vi.mocked(data.getTrip).mockResolvedValue(trip);
    vi.mocked(data.listTripBags).mockResolvedValue([]);
    vi.mocked(data.listTripEntries).mockResolvedValue([]);
    vi.mocked(data.listBags).mockResolvedValue([libraryBag]);
    vi.mocked(data.addLibraryBagToTrip).mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<TripView />);
    await openAddDialog(user, /library bag/i);

    await user.click(screen.getByLabelText("Add a bag from your library"));
    await user.type(screen.getByLabelText("Search options"), "backpack");
    await user.click(await screen.findByRole("option", { name: /Main backpack/ }));
    await user.click(screen.getByRole("button", { name: /^add bag$/i }));

    await waitFor(() => expect(data.addLibraryBagToTrip).toHaveBeenCalledWith("t1", "lb1"));
  });

  it("adds a library item chosen from the picker to the chosen destination", async () => {
    vi.mocked(data.getTrip).mockResolvedValue(trip);
    vi.mocked(data.listTripBags).mockResolvedValue([bag]);
    vi.mocked(data.listTripEntries).mockResolvedValue([]);
    vi.mocked(data.listItems).mockResolvedValue([libraryItem]);
    vi.mocked(data.addLibraryItemToTrip).mockResolvedValue("e1");
    const user = userEvent.setup();
    render(<TripView />);
    await openAddDialog(user, /library item/i);

    await user.click(screen.getByLabelText("Add an item from your library"));
    await user.type(screen.getByLabelText("Search options"), "pass");
    await user.click(await screen.findByRole("option", { name: /Passport/ }));
    await user.selectOptions(screen.getByLabelText("Destination for library item"), "bag:b1");
    await user.click(screen.getByRole("button", { name: /^add item$/i }));

    await waitFor(() => expect(data.addLibraryItemToTrip).toHaveBeenCalledWith("t1", "li1", "b1"));
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
    const withMe = screen.getByRole("region", { name: "With Me" });
    expect(within(withMe).getByText("Passport")).toBeInTheDocument();
    expect(screen.queryByText("Charger")).not.toBeInTheDocument();
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

    await user.click(screen.getByRole("button", { name: /clear/i }));

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
    await within(card).findAllByText("1.00 kg");

    await user.click(screen.getByRole("button", { name: /switch weight unit/i }));

    expect((await within(card).findAllByText("2.20 lb")).length).toBeGreaterThan(0);
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

  it("shows a departure countdown when the trip has a start date", async () => {
    vi.mocked(data.getTrip).mockResolvedValue({
      ...trip,
      start_date: "2099-01-01",
      end_date: "2099-01-10",
    });
    vi.mocked(data.listTripBags).mockResolvedValue([]);
    vi.mocked(data.listTripEntries).mockResolvedValue([entry({ id: "e1", name: "Tee" })]);
    render(<TripView />);

    expect(await screen.findByTestId("trip-countdown")).toBeInTheDocument();
  });

  it("filters entries by packed state across locations without changing progress", async () => {
    vi.mocked(data.getTrip).mockResolvedValue(trip);
    vi.mocked(data.listTripBags).mockResolvedValue([bag]);
    vi.mocked(data.listTripEntries).mockResolvedValue([
      entry({ id: "e1", name: "Charger", trip_bag_id: "b1", is_packed: true }),
      entry({ id: "e2", name: "Tee" }),
      entry({ id: "e3", is_with_me: true, name: "Passport" }),
    ]);
    const user = userEvent.setup();
    render(<TripView />);
    await screen.findByText("Charger");

    await user.click(screen.getByRole("button", { name: "To pack" }));

    expect(screen.getByText("Tee")).toBeInTheDocument();
    expect(screen.getByText("Passport")).toBeInTheDocument();
    expect(screen.queryByText("Charger")).not.toBeInTheDocument();
    expect(screen.getByText(/1\/3 packed/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Packed" }));

    expect(screen.getByText("Charger")).toBeInTheDocument();
    expect(screen.queryByText("Tee")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "All items" }));

    expect(screen.getByText("Tee")).toBeInTheDocument();
    expect(screen.getByText("Passport")).toBeInTheDocument();
  });

  it("shows an everything-packed empty state when nothing is left to pack", async () => {
    vi.mocked(data.getTrip).mockResolvedValue(trip);
    vi.mocked(data.listTripBags).mockResolvedValue([]);
    vi.mocked(data.listTripEntries).mockResolvedValue([
      entry({ id: "e1", name: "Tee", is_packed: true }),
    ]);
    const user = userEvent.setup();
    render(<TripView />);
    await screen.findByText("Tee");

    await user.click(screen.getByRole("button", { name: "To pack" }));

    expect(await screen.findByText(/everything is packed/i)).toBeInTheDocument();
    expect(screen.queryByText("Tee")).not.toBeInTheDocument();
  });

  it("shows a nothing-packed empty state when no entry is packed", async () => {
    vi.mocked(data.getTrip).mockResolvedValue(trip);
    vi.mocked(data.listTripBags).mockResolvedValue([]);
    vi.mocked(data.listTripEntries).mockResolvedValue([entry({ id: "e1", name: "Tee" })]);
    const user = userEvent.setup();
    render(<TripView />);
    await screen.findByText("Tee");

    await user.click(screen.getByRole("button", { name: "Packed" }));

    expect(await screen.findByText(/nothing packed yet/i)).toBeInTheDocument();
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
    const user = userEvent.setup();
    render(<TripView />);

    const toggle = await screen.findByRole("button", { name: /weight by category/i });
    const card = toggle.closest('[data-slot="card"]') as HTMLElement;
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(within(card).queryByText("Clothing")).not.toBeInTheDocument();

    await user.click(toggle);

    expect(within(card).getByText("Clothing")).toBeInTheDocument();
    expect(within(card).getByText("1.00 kg")).toBeInTheDocument();
    expect(within(card).getByText("0.50 kg")).toBeInTheDocument();
    expect(within(card).getByText("0.03 kg")).toBeInTheDocument();
    expect(within(card).getByText("Uncategorised")).toBeInTheDocument();
    expect(within(card).getByText("0.00 kg")).toBeInTheDocument();
    expect(within(card).getByText(/grey bars include items with no weight/i)).toBeInTheDocument();
  });

  it("duplicates the trip from the header and navigates to the copy", async () => {
    vi.mocked(data.getTrip).mockResolvedValue(trip);
    vi.mocked(data.listTripBags).mockResolvedValue([]);
    vi.mocked(data.listTripEntries).mockResolvedValue([entry({ id: "e1", name: "Passport" })]);
    vi.mocked(data.duplicateTrip).mockResolvedValue({ ...trip, id: "t2", name: "Japan (copy)" });
    const user = userEvent.setup();
    render(<TripView />);
    await screen.findByText("Passport");

    await user.click(screen.getByRole("button", { name: /duplicate/i }));

    const dialog = within(await screen.findByRole("dialog"));
    expect(dialog.getByLabelText("Name")).toHaveValue("Japan (copy)");
    expect(dialog.getByLabelText("Country")).toHaveValue("JP");
    expect(dialog.getByLabelText("Destination")).toHaveValue("Kyoto");
    expect(dialog.getByLabelText("Start date")).toHaveValue("");
    expect(dialog.getByLabelText("End date")).toHaveValue("");

    await user.click(dialog.getByRole("button", { name: /create copy/i }));

    await waitFor(() =>
      expect(data.duplicateTrip).toHaveBeenCalledWith("t1", {
        name: "Japan (copy)",
        destination: "Kyoto",
        countryCode: "JP",
        startDate: null,
        endDate: null,
      }),
    );
    await waitFor(() => expect(router.push).toHaveBeenCalledWith("/trip?id=t2"));
  });

  it("does not duplicate when the header prompt is cancelled", async () => {
    vi.mocked(data.getTrip).mockResolvedValue(trip);
    vi.mocked(data.listTripBags).mockResolvedValue([]);
    vi.mocked(data.listTripEntries).mockResolvedValue([]);
    const user = userEvent.setup();
    render(<TripView />);
    await screen.findByRole("button", { name: /duplicate/i });

    await user.click(screen.getByRole("button", { name: /duplicate/i }));
    const dialog = within(await screen.findByRole("dialog"));
    await user.click(dialog.getByRole("button", { name: /cancel/i }));

    expect(data.duplicateTrip).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });

  it("blocks duplicating without a country", async () => {
    vi.mocked(data.getTrip).mockResolvedValue(trip);
    vi.mocked(data.listTripBags).mockResolvedValue([]);
    vi.mocked(data.listTripEntries).mockResolvedValue([]);
    const user = userEvent.setup();
    render(<TripView />);
    await screen.findByRole("button", { name: /duplicate/i });

    await user.click(screen.getByRole("button", { name: /duplicate/i }));
    const dialog = within(await screen.findByRole("dialog"));
    await user.selectOptions(dialog.getByLabelText("Country"), "");
    await user.click(dialog.getByRole("button", { name: /create copy/i }));

    expect(data.duplicateTrip).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("Select a country");
  });

  it("packs every entry regardless of the active filters", async () => {
    vi.mocked(data.getTrip).mockResolvedValue(trip);
    vi.mocked(data.listTripBags).mockResolvedValue([]);
    vi.mocked(data.listTripEntries).mockResolvedValue([
      entry({ id: "e1", name: "Passport" }),
      entry({ id: "e2", name: "Adapter" }),
    ]);
    vi.mocked(data.setTripPacked).mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<TripView />);
    await screen.findByText("Passport");

    await user.type(screen.getByLabelText("Search items"), "pass");
    expect(screen.queryByText("Adapter")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^pack all/i }));

    await waitFor(() => expect(data.setTripPacked).toHaveBeenCalledWith("t1", true));
    expect(data.updateEntry).not.toHaveBeenCalled();
  });

  it("unpacks every entry in one action", async () => {
    vi.mocked(data.getTrip).mockResolvedValue(trip);
    vi.mocked(data.listTripBags).mockResolvedValue([]);
    vi.mocked(data.listTripEntries).mockResolvedValue([
      entry({ id: "e1", name: "Passport", is_packed: true }),
      entry({ id: "e2", name: "Adapter", is_packed: true }),
    ]);
    vi.mocked(data.setTripPacked).mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<TripView />);
    await screen.findByText("Passport");

    await user.click(screen.getByRole("button", { name: /^unpack all/i }));

    await waitFor(() => expect(data.setTripPacked).toHaveBeenCalledWith("t1", false));
  });

  it("offers a transient undo that restores the previous packed state", async () => {
    vi.mocked(data.getTrip).mockResolvedValue(trip);
    vi.mocked(data.listTripBags).mockResolvedValue([]);
    vi.mocked(data.listTripEntries).mockResolvedValue([
      entry({ id: "e1", name: "Passport", is_packed: true }),
      entry({ id: "e2", name: "Adapter", is_packed: false }),
    ]);
    vi.mocked(data.setTripPacked).mockResolvedValue(undefined);
    vi.mocked(data.updateEntry).mockResolvedValue(entry({ id: "e2" }));
    const user = userEvent.setup();
    render(<TripView />);
    await screen.findByText("Passport");

    await user.click(screen.getByRole("button", { name: /^pack all/i }));
    await waitFor(() => expect(data.setTripPacked).toHaveBeenCalledWith("t1", true));

    const call = vi
      .mocked(toast.success)
      .mock.calls.find(([message]) => /packed all/i.test(String(message)));
    expect(call).toBeTruthy();
    const options = call![1] as { action?: { onClick?: () => void } };

    await act(async () => {
      options.action?.onClick?.();
    });

    // Only the entry that was unpacked before is reverted.
    await waitFor(() => expect(data.updateEntry).toHaveBeenCalledWith("e2", { is_packed: false }));
    expect(data.updateEntry).not.toHaveBeenCalledWith("e1", expect.anything());
  });

  it("changes nothing but packed state", async () => {
    vi.mocked(data.getTrip).mockResolvedValue(trip);
    vi.mocked(data.listTripBags).mockResolvedValue([]);
    vi.mocked(data.listTripEntries).mockResolvedValue([
      entry({
        id: "e1",
        name: "Passport",
        qty: 3,
        is_with_me: true,
        category: "documents",
        weight_grams: 100,
      }),
    ]);
    vi.mocked(data.setTripPacked).mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<TripView />);
    await screen.findByText("Passport");

    await user.click(screen.getByRole("button", { name: /^pack all/i }));
    await waitFor(() => expect(data.setTripPacked).toHaveBeenCalledWith("t1", true));

    expect(data.updateEntry).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Quantity for Passport")).toHaveValue(3);
    expect(screen.getByLabelText("Location")).toHaveValue("with_me");
  });

  it("shows an entry's weight in its row", async () => {
    vi.mocked(data.getTrip).mockResolvedValue(trip);
    vi.mocked(data.listTripEntries).mockResolvedValue([
      entry({ id: "e1", name: "Charger", weight_grams: 1200 }),
    ]);
    render(<TripView />);

    const row = (await screen.findByText("Charger")).closest("div.rounded-md") as HTMLElement;
    expect(within(row).getByText("1.20 kg")).toBeInTheDocument();
  });
});
