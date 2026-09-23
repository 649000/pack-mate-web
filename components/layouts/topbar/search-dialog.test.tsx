import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReusableBag, ReusableItem, Trip } from "@/lib/types";

const push = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

vi.mock("@/lib/data", () => ({
  listTrips: vi.fn(),
  listItems: vi.fn(),
  listBags: vi.fn(),
}));

import * as data from "@/lib/data";
import { SearchDialog } from "./search-dialog";

const trip: Trip = {
  id: "t1",
  user_id: "u1",
  name: "Passport trip",
  destination: null,
  country_code: "JP",
  start_date: null,
  end_date: null,
  created_at: "2026-01-01T00:00:00Z",
};

const item: ReusableItem = {
  id: "i1",
  user_id: "u1",
  name: "Passport",
  default_qty: 1,
  description: null,
  link: null,
  image_url: null,
  weight_grams: null,
  category: null,
  created_at: "2026-01-01T00:00:00Z",
};

const bag: ReusableBag = {
  id: "b1",
  user_id: "u1",
  name: "Passport pouch",
  weight_limit_grams: null,
  icon: null,
  created_at: "2026-01-01T00:00:00Z",
};

async function openDialog() {
  const user = userEvent.setup();
  render(<SearchDialog />);
  await user.click(screen.getByRole("button", { name: "Search" }));
  return user;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(data.listTrips).mockResolvedValue([trip]);
  vi.mocked(data.listItems).mockResolvedValue([item]);
  vi.mocked(data.listBags).mockResolvedValue([bag]);
});

describe("SearchDialog", () => {
  it("shows the navigation destinations for an empty query", async () => {
    await openDialog();

    expect(await screen.findByText("Trips")).toBeInTheDocument();
    expect(screen.getByText("Items")).toBeInTheDocument();
    expect(screen.getByText("Bags")).toBeInTheDocument();
  });

  it("groups name matches by type", async () => {
    const user = await openDialog();

    await user.type(screen.getByPlaceholderText("Search Pack Mate..."), "pass");

    expect(await screen.findByText("Passport")).toBeInTheDocument();
    expect(screen.getByText("Passport trip")).toBeInTheDocument();
    expect(screen.getByText("Passport pouch")).toBeInTheDocument();
  });

  it("shows an empty state when nothing matches", async () => {
    const user = await openDialog();

    await user.type(screen.getByPlaceholderText("Search Pack Mate..."), "zzz");

    expect(await screen.findByText("No results.")).toBeInTheDocument();
  });

  it("navigates to the filtered list when a result is selected", async () => {
    const user = await openDialog();

    await user.type(screen.getByPlaceholderText("Search Pack Mate..."), "pass");
    await user.click(await screen.findByText("Passport"));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/items?q=pass"));
  });
});
