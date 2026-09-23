import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Trip, TripEntry } from "@/lib/types";

vi.mock("@/lib/data", () => ({
  listTrips: vi.fn(),
  getProfile: vi.fn(),
  listTripBags: vi.fn(),
  listTripEntries: vi.fn(),
  getDestinationFacts: vi.fn(),
  listSuggestionDismissals: vi.fn(),
}));

vi.mock("@/lib/suggestions", () => ({
  getTripSuggestions: vi.fn().mockResolvedValue([]),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

import * as data from "@/lib/data";
import { DashboardView } from "./page";

const trip: Trip = {
  id: "t1",
  user_id: "u1",
  name: "Japan",
  destination: "Kyoto",
  country_code: "JP",
  start_date: "2030-03-01",
  end_date: "2030-03-10",
  created_at: "2026-01-01T00:00:00Z",
};

const entry: TripEntry = {
  id: "e1",
  trip_id: "t1",
  trip_bag_id: null,
  name: "Passport",
  qty: 1,
  source_item_id: null,
  is_with_me: false,
  is_packed: true,
  position: 0,
  description: null,
  link: null,
  image_url: null,
  weight_grams: 100,
  category: "documents",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(data.getProfile).mockResolvedValue(null);
  vi.mocked(data.listTripBags).mockResolvedValue([]);
  vi.mocked(data.listTripEntries).mockResolvedValue([]);
});

describe("DashboardView", () => {
  it("shows an empty state when there are no trips", async () => {
    vi.mocked(data.listTrips).mockResolvedValue([]);
    render(<DashboardView />);
    expect(await screen.findByText(/no trips yet/i)).toBeInTheDocument();
  });

  it("summarises existing trips and the next journey", async () => {
    vi.mocked(data.listTrips).mockResolvedValue([trip]);
    vi.mocked(data.listTripEntries).mockResolvedValue([entry]);
    render(<DashboardView />);

    expect((await screen.findAllByText("Japan")).length).toBeGreaterThan(0);
    expect(screen.getByText(/next journey/i)).toBeInTheDocument();
    expect(await screen.findByText(/1\/1 packed/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /continue packing/i })).toHaveAttribute(
      "href",
      "/trip?id=t1",
    );
  });
});
