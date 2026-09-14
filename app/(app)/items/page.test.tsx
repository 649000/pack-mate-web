import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReusableItem } from "@/lib/types";

vi.mock("@/lib/data", () => ({
  listItems: vi.fn(),
  createItem: vi.fn(),
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import * as data from "@/lib/data";
import { ItemsView } from "./page";

const item: ReusableItem = {
  id: "i1",
  user_id: "u1",
  name: "Passport",
  default_qty: 2,
  created_at: "2026-01-01T00:00:00Z",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ItemsView", () => {
  it("shows an empty state when there are no items", async () => {
    vi.mocked(data.listItems).mockResolvedValue([]);
    render(<ItemsView />);
    expect(await screen.findByText(/no items yet/i)).toBeInTheDocument();
  });

  it("surfaces a load failure", async () => {
    vi.mocked(data.listItems).mockRejectedValue(new Error("boom"));
    render(<ItemsView />);
    await waitFor(() => expect(vi.mocked(toast.error)).toHaveBeenCalled());
  });

  it("lists existing items with their default quantity", async () => {
    vi.mocked(data.listItems).mockResolvedValue([item]);
    render(<ItemsView />);
    expect(await screen.findByText("Passport")).toBeInTheDocument();
    expect(screen.getByText(/default quantity: 2/i)).toBeInTheDocument();
  });

  it("creates an item from the dialog", async () => {
    vi.mocked(data.listItems).mockResolvedValue([]);
    vi.mocked(data.createItem).mockResolvedValue(item);
    const user = userEvent.setup();
    render(<ItemsView />);
    await screen.findByText(/no items yet/i);

    await user.click(screen.getByRole("button", { name: /add item/i }));
    await user.type(await screen.findByLabelText("Name"), "Passport");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() =>
      expect(data.createItem).toHaveBeenCalledWith({ name: "Passport", defaultQty: 1 }),
    );
  });

  it("does not create an item with a blank name", async () => {
    vi.mocked(data.listItems).mockResolvedValue([]);
    const user = userEvent.setup();
    render(<ItemsView />);
    await screen.findByText(/no items yet/i);

    await user.click(screen.getByRole("button", { name: /add item/i }));
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => expect(data.createItem).not.toHaveBeenCalled());
  });

  it("edits an item", async () => {
    vi.mocked(data.listItems).mockResolvedValue([item]);
    vi.mocked(data.updateItem).mockResolvedValue({ ...item, name: "Tee" });
    const user = userEvent.setup();
    render(<ItemsView />);
    await screen.findByText("Passport");

    await user.click(screen.getByRole("button", { name: /^edit$/i }));
    const name = await screen.findByLabelText("Name");
    await user.clear(name);
    await user.type(name, "Tee");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() =>
      expect(data.updateItem).toHaveBeenCalledWith("i1", { name: "Tee", defaultQty: 2 }),
    );
  });

  it("deletes an item after confirmation", async () => {
    vi.mocked(data.listItems).mockResolvedValue([item]);
    vi.mocked(data.deleteItem).mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<ItemsView />);
    await screen.findByText("Passport");

    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    const confirm = await screen.findAllByRole("button", { name: /^delete$/i });
    await user.click(confirm[confirm.length - 1]);

    await waitFor(() => expect(data.deleteItem).toHaveBeenCalledWith("i1"));
  });
});
