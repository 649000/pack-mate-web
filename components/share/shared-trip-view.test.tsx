import { render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getDestinationFacts = vi.hoisted(() => vi.fn());

vi.mock("@/lib/data", () => ({ getDestinationFacts }));

import { SharedTripView } from "./shared-trip-view";
import type { SharedTripBag, SharedTripEntry } from "@/lib/types";

function bag(overrides: Partial<SharedTripBag> & { id: string; name: string }): SharedTripBag {
  return {
    parent_bag_id: null,
    position: 0,
    weight_limit_grams: null,
    icon: null,
    ...overrides,
  };
}

function entry(
  overrides: Partial<SharedTripEntry> & { id: string; name: string },
): SharedTripEntry {
  return {
    trip_bag_id: null,
    qty: 1,
    is_with_me: false,
    is_packed: false,
    position: 0,
    description: null,
    link: null,
    image_url: null,
    weight_grams: null,
    category: null,
    ...overrides,
  };
}

const trip = {
  name: "Japan",
  destination: "Kyoto",
  country_code: "JP",
  start_date: "2026-03-01",
  end_date: "2026-03-10",
};

beforeEach(() => {
  vi.clearAllMocks();
  getDestinationFacts.mockResolvedValue(null);
});

describe("SharedTripView", () => {
  it("renders a populated list grouped by bag, With Me and unassigned", () => {
    const bags = [bag({ id: "b1", name: "Main", weight_limit_grams: 23000 })];
    const entries = [
      entry({ id: "e1", name: "Tent", trip_bag_id: "b1", is_packed: true, weight_grams: 1200 }),
      entry({ id: "e2", name: "Passport", is_with_me: true, weight_grams: 30 }),
      entry({ id: "e3", name: "Loose socks", qty: 3 }),
    ];

    render(<SharedTripView trip={trip} bags={bags} entries={entries} />);

    expect(screen.getByRole("heading", { name: "Japan" })).toBeInTheDocument();
    expect(screen.getByText("Kyoto, Japan")).toBeInTheDocument();
    expect(screen.queryByText("JP")).not.toBeInTheDocument();
    expect(screen.getByText(/2026-03-01 to 2026-03-10/)).toBeInTheDocument();
    expect(screen.getByText("Main")).toBeInTheDocument();
    expect(screen.getByText("With Me")).toBeInTheDocument();
    expect(screen.getByText("Not assigned")).toBeInTheDocument();
    expect(screen.getByText("Tent")).toBeInTheDocument();
    expect(screen.getByText("Passport")).toBeInTheDocument();
    expect(screen.getByText("Loose socks")).toBeInTheDocument();
    expect(screen.getByText(/1 of 3 packed/i)).toBeInTheDocument();
    expect(screen.getByText(/Baggage/)).toHaveTextContent("1.20 kg");
  });

  it("renders nested bags and an entry's nested location path", () => {
    const bags = [
      bag({ id: "outer", name: "Outer", position: 0 }),
      bag({ id: "inner", name: "Inner", parent_bag_id: "outer", position: 1 }),
    ];
    const entries = [entry({ id: "e1", name: "Charger", trip_bag_id: "inner" })];

    render(<SharedTripView trip={trip} bags={bags} entries={entries} />);

    expect(screen.getByText("Outer")).toBeInTheDocument();
    expect(screen.getByText("Inner")).toBeInTheDocument();
    expect(screen.getByText("Outer > Inner")).toBeInTheDocument();
  });

  it("shows an empty state for an empty list", () => {
    render(<SharedTripView trip={trip} bags={[]} entries={[]} />);

    expect(screen.getByText(/this packing list is empty/i)).toBeInTheDocument();
    expect(screen.getByText(/0 of 0 packed/i)).toBeInTheDocument();
  });

  it("renders entry details with a safe external link", () => {
    const entries = [
      entry({
        id: "e1",
        name: "Tent",
        description: "Two person",
        link: "https://example.com/tent",
      }),
    ];

    render(<SharedTripView trip={trip} bags={[]} entries={entries} />);

    const link = screen.getByRole("link", { name: "https://example.com/tent" });
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByText("Two person")).toBeInTheDocument();
  });

  it("shows the departure countdown when the trip has a start date", () => {
    render(<SharedTripView trip={trip} bags={[]} entries={[]} />);

    expect(screen.getByTestId("trip-countdown")).toBeInTheDocument();
  });

  it("omits the countdown when the trip has no start date", () => {
    render(
      <SharedTripView
        trip={{ ...trip, start_date: null, end_date: null }}
        bags={[]}
        entries={[]}
      />,
    );

    expect(screen.queryByTestId("trip-countdown")).not.toBeInTheDocument();
  });

  it("shows category badges and a weight-by-category breakdown", () => {
    const bags = [bag({ id: "b1", name: "Main" })];
    const entries = [
      entry({
        id: "e1",
        name: "Tent",
        trip_bag_id: "b1",
        weight_grams: 1000,
        category: "sports",
      }),
      entry({
        id: "e2",
        name: "Passport",
        is_with_me: true,
        weight_grams: 30,
        category: "documents",
      }),
      entry({ id: "e3", name: "Adapter", category: null }),
    ];

    render(<SharedTripView trip={trip} bags={bags} entries={entries} />);

    const tentRow = screen.getByText("Tent").closest("div.rounded-md") as HTMLElement;
    expect(within(tentRow).getByText("Sports & Outdoors")).toBeInTheDocument();
    const passportRow = screen.getByText("Passport").closest("div.rounded-md") as HTMLElement;
    expect(within(passportRow).getByText("Documents & Money")).toBeInTheDocument();

    const card = screen
      .getByText("Weight by category")
      .closest('[data-slot="card"]') as HTMLElement;
    expect(within(card).getByText("Sports & Outdoors")).toBeInTheDocument();
    expect(within(card).getByText("1.00 kg")).toBeInTheDocument();
    expect(within(card).getByText("Documents & Money")).toBeInTheDocument();
    expect(within(card).getByText("0.03 kg")).toBeInTheDocument();
    expect(within(card).getByText("Uncategorised")).toBeInTheDocument();
    expect(within(card).getByText("0.00 kg")).toBeInTheDocument();
    expect(within(card).getByText(/grey bars include items with no weight/i)).toBeInTheDocument();
  });

  it("shows destination facts for the trip's country", async () => {
    getDestinationFacts.mockResolvedValue({
      country_code: "JP",
      currency_code: "JPY",
      calling_code: "+81",
      plug_types: ["A", "B"],
      voltage: "100",
      frequency: "50/60",
      timezones: ["Asia/Tokyo"],
      updated_at: "2026-01-01T00:00:00Z",
    });

    render(<SharedTripView trip={trip} bags={[]} entries={[]} />);

    expect(await screen.findByText("Destination info")).toBeInTheDocument();
    expect(screen.getByAltText("Type A plug")).toBeInTheDocument();
    expect(screen.getByText("JPY ¥")).toBeInTheDocument();
  });

  it("does not break the shared list when destination facts fail", async () => {
    getDestinationFacts.mockRejectedValue(new Error("offline"));

    render(<SharedTripView trip={trip} bags={[]} entries={[]} />);

    expect(screen.getByRole("heading", { name: "Japan" })).toBeInTheDocument();
    await waitFor(() => expect(getDestinationFacts).toHaveBeenCalled());
    expect(screen.queryByText("Destination info")).not.toBeInTheDocument();
  });
});
