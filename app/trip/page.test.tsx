import { render, screen, waitFor } from "@testing-library/react";
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
  addLibraryBagToTrip: vi.fn(),
  addLibraryItemToTrip: vi.fn(),
  addAdHocEntry: vi.fn(),
  deleteEntry: vi.fn(),
  reorderEntries: vi.fn(),
  setEntryLocation: vi.fn(),
  updateEntry: vi.fn(),
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
    ...partial,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(data.listBags).mockResolvedValue([]);
  vi.mocked(data.listItems).mockResolvedValue([]);
});

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
});
