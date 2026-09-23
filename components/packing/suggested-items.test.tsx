import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Trip } from "@/lib/types";
import type { Suggestion } from "@/lib/suggestions";

vi.mock("@/lib/data", () => ({
  getDestinationFacts: vi.fn(),
  listSuggestionDismissals: vi.fn(),
  addLibraryItemToTrip: vi.fn(),
  addAdHocEntry: vi.fn(),
  dismissSuggestion: vi.fn(),
}));

const getTripSuggestions = vi.hoisted(() => vi.fn());
vi.mock("@/lib/suggestions", () => ({ getTripSuggestions }));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import * as data from "@/lib/data";
import { SuggestedItems } from "./suggested-items";

const trip: Trip = {
  id: "t1",
  user_id: "u1",
  name: "Barcelona",
  destination: "Barcelona",
  country_code: "ES",
  start_date: "2026-10-12",
  end_date: "2026-10-19",
  created_at: "2026-01-01T00:00:00Z",
};

function suggestion(overrides: Partial<Suggestion> = {}): Suggestion {
  return {
    key: "rules:adapter:CF",
    name: "Travel adapter",
    reason: "Spain uses Type C, Type F plugs.",
    category: "gear",
    action: { kind: "create-item", name: "Travel adapter", category: "gear" },
    source: "rules",
    confidence: 1,
    ...overrides,
  };
}

function renderComponent(onChanged = vi.fn()) {
  return render(
    <SuggestedItems trip={trip} entries={[]} libraryItems={[]} onChanged={onChanged} />,
  );
}

beforeEach(() => {
  vi.mocked(data.getDestinationFacts).mockResolvedValue(null);
  vi.mocked(data.listSuggestionDismissals).mockResolvedValue([]);
  getTripSuggestions.mockResolvedValue([suggestion()]);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("SuggestedItems", () => {
  it("shows a suggestion with its reason", async () => {
    renderComponent();
    expect(await screen.findByText("Travel adapter")).toBeInTheDocument();
    expect(screen.getByText(/Type C, Type F/)).toBeInTheDocument();
  });

  it("renders nothing when there are no suggestions", async () => {
    getTripSuggestions.mockResolvedValue([]);
    renderComponent();
    await waitFor(() => expect(data.listSuggestionDismissals).toHaveBeenCalled());
    expect(screen.queryByText(/Suggested for this trip/i)).not.toBeInTheDocument();
  });

  it("hides a dismissed suggestion", async () => {
    vi.mocked(data.listSuggestionDismissals).mockResolvedValue(["rules:adapter:CF"]);
    renderComponent();
    await waitFor(() => expect(data.listSuggestionDismissals).toHaveBeenCalled());
    expect(screen.queryByText("Travel adapter")).not.toBeInTheDocument();
  });

  it("adds a suggestion as a new item", async () => {
    const onChanged = vi.fn();
    const user = userEvent.setup();
    renderComponent(onChanged);

    await user.click(await screen.findByRole("button", { name: /add travel adapter to trip/i }));

    await waitFor(() =>
      expect(data.addAdHocEntry).toHaveBeenCalledWith({
        tripId: "t1",
        name: "Travel adapter",
        qty: 1,
        tripBagId: null,
      }),
    );
    expect(onChanged).toHaveBeenCalled();
  });

  it("adds a suggestion from the library when it exists", async () => {
    getTripSuggestions.mockResolvedValue([
      suggestion({ action: { kind: "library-item", itemId: "i1" } }),
    ]);
    const user = userEvent.setup();
    renderComponent();

    await user.click(await screen.findByRole("button", { name: /add travel adapter to trip/i }));

    await waitFor(() => expect(data.addLibraryItemToTrip).toHaveBeenCalledWith("t1", "i1", null));
  });

  it("dismisses a suggestion", async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(await screen.findByRole("button", { name: /dismiss travel adapter/i }));

    await waitFor(() =>
      expect(data.dismissSuggestion).toHaveBeenCalledWith({
        tripId: "t1",
        key: "rules:adapter:CF",
        source: "rules",
      }),
    );
  });
});
