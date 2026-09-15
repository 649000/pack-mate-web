import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SharedTrip } from "@/lib/types";

const TOKEN = "a".repeat(64);
const searchParams = vi.hoisted(() => ({ value: "" }));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(searchParams.value),
}));

vi.mock("@/lib/data", () => ({ getSharedTrip: vi.fn() }));

import * as data from "@/lib/data";
import { SharedTripPage } from "@/components/share/shared-trip-page";

function payload(packed: boolean): SharedTrip {
  return {
    v: 2,
    trip: { name: "Japan", start_date: "2026-03-01", end_date: "2026-03-10" },
    bags: [],
    entries: [
      {
        id: "e1",
        trip_bag_id: null,
        name: "Passport",
        qty: 1,
        is_with_me: true,
        is_packed: packed,
        position: 0,
        description: null,
        link: null,
        image_url: null,
        weight_grams: null,
        category: null,
      },
    ],
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  searchParams.value = `?t=${TOKEN}`;
});

describe("SharedTripPage", () => {
  it("shows the packing list for a valid token", async () => {
    vi.mocked(data.getSharedTrip).mockResolvedValue(payload(false));

    render(<SharedTripPage />);

    expect(await screen.findByText("Japan")).toBeInTheDocument();
    expect(screen.getByText("Passport")).toBeInTheDocument();
    expect(screen.getByText(/0 of 1 packed/i)).toBeInTheDocument();
    expect(data.getSharedTrip).toHaveBeenCalledWith(TOKEN);
  });

  it("shows a generic unavailable state for an unknown token", async () => {
    vi.mocked(data.getSharedTrip).mockResolvedValue(null);

    render(<SharedTripPage />);

    expect(await screen.findByText(/not available/i)).toBeInTheDocument();
  });

  it("does not call the API for a malformed token", async () => {
    searchParams.value = "?t=not-a-token";

    render(<SharedTripPage />);

    expect(await screen.findByText(/not available/i)).toBeInTheDocument();
    expect(data.getSharedTrip).not.toHaveBeenCalled();
  });

  it("refresh picks up changed data", async () => {
    vi.mocked(data.getSharedTrip)
      .mockResolvedValueOnce(payload(false))
      .mockResolvedValueOnce(payload(true));
    const user = userEvent.setup();

    render(<SharedTripPage />);
    await screen.findByText(/0 of 1 packed/i);

    await user.click(screen.getByRole("button", { name: /refresh/i }));

    expect(await screen.findByText(/1 of 1 packed/i)).toBeInTheDocument();
    expect(data.getSharedTrip).toHaveBeenCalledTimes(2);
  });

  it("offers no mutation controls", async () => {
    vi.mocked(data.getSharedTrip).mockResolvedValue(payload(false));

    render(<SharedTripPage />);
    await screen.findByText("Passport");

    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /remove|delete|save/i })).not.toBeInTheDocument();
  });
});
