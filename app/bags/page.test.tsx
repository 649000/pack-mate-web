import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReusableBag } from "@/lib/types";

vi.mock("@/lib/data", () => ({
  listBags: vi.fn(),
  listItems: vi.fn(),
  createBag: vi.fn(),
  updateBag: vi.fn(),
  deleteBag: vi.fn(),
  listBagContents: vi.fn(),
  addBagItem: vi.fn(),
  removeBagItem: vi.fn(),
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
  created_at: "2026-01-01T00:00:00Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(data.listItems).mockResolvedValue([]);
  vi.mocked(data.listBagContents).mockResolvedValue([]);
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

    await waitFor(() => expect(data.createBag).toHaveBeenCalledWith({ name: "Electronics" }));
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
});
