import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReusableBag, ReusableItem, Trip } from "@/lib/types";

const params = vi.hoisted(() => ({ current: "" }));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(params.current),
}));

vi.mock("@/lib/data", () => ({
  listBags: vi.fn(),
  listItems: vi.fn(),
  listAllBagItems: vi.fn(),
  getProfile: vi.fn(),
  createBag: vi.fn(),
  updateBag: vi.fn(),
  deleteBag: vi.fn(),
  duplicateBag: vi.fn(),
  listBagContents: vi.fn(),
  addBagItem: vi.fn(),
  removeBagItem: vi.fn(),
  listTrips: vi.fn(),
  addLibraryBagToTrip: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import * as data from "@/lib/data";
import { BagsView } from "./page";

const bag: ReusableBag = {
  id: "b1",
  user_id: "u1",
  name: "Electronics",
  weight_limit_grams: null,
  icon: null,
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
  category: "documents",
  created_at: "2026-01-01T00:00:00Z",
};

const trip: Trip = {
  id: "t1",
  user_id: "u1",
  name: "Japan",
  destination: null,
  country_code: "JP",
  start_date: null,
  end_date: null,
  created_at: "2026-01-01T00:00:00Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  params.current = "";
  vi.mocked(data.listItems).mockResolvedValue([]);
  vi.mocked(data.getProfile).mockResolvedValue(null);
  vi.mocked(data.listBagContents).mockResolvedValue([]);
  vi.mocked(data.listAllBagItems).mockResolvedValue([]);
  vi.mocked(data.listTrips).mockResolvedValue([]);
});

describe("BagsView", () => {
  it("shows an empty state when there are no bags", async () => {
    vi.mocked(data.listBags).mockResolvedValue([]);
    render(<BagsView />);
    expect(await screen.findByText(/no bags yet/i)).toBeInTheDocument();
  });

  it("lists existing bags", async () => {
    vi.mocked(data.listBags).mockResolvedValue([bag]);
    render(<BagsView />);
    expect(await screen.findByText("Electronics")).toBeInTheDocument();
  });

  it("creates a bag from the dialog", async () => {
    vi.mocked(data.listBags).mockResolvedValue([]);
    vi.mocked(data.createBag).mockResolvedValue(bag);
    const user = userEvent.setup();
    render(<BagsView />);
    await screen.findByText(/no bags yet/i);

    await user.click(screen.getByRole("button", { name: /add bag/i }));
    await user.type(await screen.findByLabelText("Name"), "Electronics");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() =>
      expect(data.createBag).toHaveBeenCalledWith({
        name: "Electronics",
        weightLimitGrams: null,
        icon: null,
      }),
    );
  });

  it("saves a chosen icon", async () => {
    vi.mocked(data.listBags).mockResolvedValue([]);
    vi.mocked(data.createBag).mockResolvedValue({ ...bag, icon: "camera" });
    const user = userEvent.setup();
    render(<BagsView />);
    await screen.findByText(/no bags yet/i);

    await user.click(screen.getByRole("button", { name: /add bag/i }));
    await user.type(await screen.findByLabelText("Name"), "Camera kit");
    await user.click(screen.getByRole("button", { name: "Camera" }));
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() =>
      expect(data.createBag).toHaveBeenCalledWith({
        name: "Camera kit",
        weightLimitGrams: null,
        icon: "camera",
      }),
    );
  });

  it("creates a bag with a weight limit in the preferred unit", async () => {
    vi.mocked(data.listBags).mockResolvedValue([]);
    vi.mocked(data.createBag).mockResolvedValue(bag);
    const user = userEvent.setup();
    render(<BagsView />);
    await screen.findByText(/no bags yet/i);

    await user.click(screen.getByRole("button", { name: /add bag/i }));
    await user.type(await screen.findByLabelText("Name"), "Main");
    await user.type(screen.getByLabelText(/weight limit \(kg\)/i), "23");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() =>
      expect(data.createBag).toHaveBeenCalledWith({
        name: "Main",
        weightLimitGrams: 23000,
        icon: null,
      }),
    );
  });

  it("shows a bag's weight limit", async () => {
    vi.mocked(data.listBags).mockResolvedValue([{ ...bag, weight_limit_grams: 23000 }]);
    render(<BagsView />);
    expect(await screen.findByText("Limit 23.00 kg")).toBeInTheDocument();
  });

  it("opens a bag's default contents", async () => {
    vi.mocked(data.listBags).mockResolvedValue([bag]);
    const user = userEvent.setup();
    render(<BagsView />);
    await screen.findByText("Electronics");

    await user.click(screen.getByRole("button", { name: /contents/i }));
    expect(await screen.findByText(/no default contents yet/i)).toBeInTheDocument();
    expect(data.listBagContents).toHaveBeenCalledWith("b1");
  });

  it("adds an item to a bag's default contents from the picker", async () => {
    vi.mocked(data.listBags).mockResolvedValue([bag]);
    vi.mocked(data.listItems).mockResolvedValue([item]);
    vi.mocked(data.addBagItem).mockResolvedValue({
      id: "bi1",
      bag_id: "b1",
      item_id: "i1",
      qty: 1,
      position: 0,
    });
    const user = userEvent.setup();
    render(<BagsView />);
    await screen.findByText("Electronics");

    await user.click(screen.getByRole("button", { name: /contents/i }));
    await screen.findByText(/no default contents yet/i);

    await user.click(screen.getByLabelText("Item"));
    await user.type(screen.getByLabelText("Search options"), "pass");
    await user.click(await screen.findByRole("option", { name: /Passport/ }));
    await user.click(screen.getByRole("button", { name: /^add$/i }));

    await waitFor(() => expect(data.addBagItem).toHaveBeenCalledWith("b1", "i1", 1));
  });

  it("adds a library bag to a trip", async () => {
    vi.mocked(data.listBags).mockResolvedValue([bag]);
    vi.mocked(data.listTrips).mockResolvedValue([trip]);
    vi.mocked(data.addLibraryBagToTrip).mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<BagsView />);

    await screen.findByText("Electronics");
    await user.click(screen.getByRole("button", { name: "Add to trip" }));

    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /add to trip/i }));

    await waitFor(() => expect(data.addLibraryBagToTrip).toHaveBeenCalledWith("t1", "b1"));
  });

  it("duplicates a bag", async () => {
    vi.mocked(data.listBags).mockResolvedValue([bag]);
    vi.mocked(data.duplicateBag).mockResolvedValue({
      ...bag,
      id: "b2",
      name: "Electronics (copy)",
    });
    const user = userEvent.setup();
    render(<BagsView />);

    await screen.findByText("Electronics");
    await user.click(screen.getByRole("button", { name: "Duplicate" }));

    await waitFor(() => expect(data.duplicateBag).toHaveBeenCalledWith("b1"));
  });

  it("edits a bag", async () => {
    vi.mocked(data.listBags).mockResolvedValue([bag]);
    vi.mocked(data.updateBag).mockResolvedValue({ ...bag, name: "Gear" });
    const user = userEvent.setup();
    render(<BagsView />);
    await screen.findByText("Electronics");

    await user.click(screen.getByRole("button", { name: /^edit$/i }));
    const name = await screen.findByLabelText("Name");
    await user.clear(name);
    await user.type(name, "Gear");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() =>
      expect(data.updateBag).toHaveBeenCalledWith("b1", {
        name: "Gear",
        weightLimitGrams: null,
        icon: null,
      }),
    );
  });

  it("deletes a bag after confirmation", async () => {
    vi.mocked(data.listBags).mockResolvedValue([bag]);
    vi.mocked(data.deleteBag).mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<BagsView />);
    await screen.findByText("Electronics");

    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    const confirm = await screen.findAllByRole("button", { name: /^delete$/i });
    await user.click(confirm[confirm.length - 1]);

    await waitFor(() => expect(data.deleteBag).toHaveBeenCalledWith("b1"));
  });

  it("filters bags from the query parameter on first render", async () => {
    vi.mocked(data.listBags).mockResolvedValue([
      { ...bag, id: "b1", name: "Daypack" },
      { ...bag, id: "b2", name: "Suitcase" },
    ]);
    params.current = "q=day";
    render(<BagsView />);

    expect(await screen.findByText("Daypack")).toBeInTheDocument();
    expect(screen.queryByText("Suitcase")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Search bags")).toHaveValue("day");
  });

  it("filters bags as the user types and restores them when cleared", async () => {
    vi.mocked(data.listBags).mockResolvedValue([
      { ...bag, id: "b1", name: "Daypack" },
      { ...bag, id: "b2", name: "Suitcase" },
    ]);
    const user = userEvent.setup();
    render(<BagsView />);
    await screen.findByText("Daypack");

    await user.type(screen.getByLabelText("Search bags"), "suit");
    expect(screen.getByText("Suitcase")).toBeInTheDocument();
    expect(screen.queryByText("Daypack")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /clear/i }));
    expect(screen.getByText("Daypack")).toBeInTheDocument();
  });

  it("shows an empty state naming the query when nothing matches", async () => {
    vi.mocked(data.listBags).mockResolvedValue([bag]);
    const user = userEvent.setup();
    render(<BagsView />);
    await screen.findByText("Electronics");

    await user.type(screen.getByLabelText("Search bags"), "zzz");
    expect(screen.getByText(/no bags match .*zzz/i)).toBeInTheDocument();
  });
});
