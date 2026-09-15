import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReusableItem } from "@/lib/types";

vi.mock("@/lib/data", () => ({
  listItems: vi.fn(),
  getProfile: vi.fn(),
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
  description: null,
  link: null,
  image_url: null,
  weight_grams: null,
  category: null,
  created_at: "2026-01-01T00:00:00Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(data.getProfile).mockResolvedValue(null);
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

  it("shows an item's description, link, image and weight", async () => {
    vi.mocked(data.listItems).mockResolvedValue([
      {
        ...item,
        description: "Navy cover",
        link: "https://example.com/passport",
        image_url: "https://example.com/passport.jpg",
        weight_grams: 1200,
      },
    ]);
    render(<ItemsView />);

    expect(await screen.findByText("Navy cover")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /example\.com\/passport$/ })).toHaveAttribute(
      "href",
      "https://example.com/passport",
    );
    expect(screen.getByAltText("Passport")).toBeInTheDocument();
    expect(screen.getByText("1.20 kg")).toBeInTheDocument();
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
      expect(data.createItem).toHaveBeenCalledWith({
        name: "Passport",
        defaultQty: 1,
        description: null,
        link: null,
        imageUrl: null,
        weightGrams: null,
        category: null,
      }),
    );
  });

  it("creates an item with details from the dialog", async () => {
    vi.mocked(data.listItems).mockResolvedValue([]);
    vi.mocked(data.createItem).mockResolvedValue(item);
    const user = userEvent.setup();
    render(<ItemsView />);
    await screen.findByText(/no items yet/i);

    await user.click(screen.getByRole("button", { name: /add item/i }));
    await user.type(await screen.findByLabelText("Name"), "Passport");
    await user.type(screen.getByLabelText("Description"), "Navy cover");
    await user.type(screen.getByLabelText("Link"), "https://example.com/passport");
    await user.type(screen.getByLabelText("Image URL"), "https://example.com/passport.jpg");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() =>
      expect(data.createItem).toHaveBeenCalledWith({
        name: "Passport",
        defaultQty: 1,
        description: "Navy cover",
        link: "https://example.com/passport",
        imageUrl: "https://example.com/passport.jpg",
        weightGrams: null,
        category: null,
      }),
    );
  });

  it("converts a weight entered in the preferred unit to grams", async () => {
    vi.mocked(data.listItems).mockResolvedValue([]);
    vi.mocked(data.getProfile).mockResolvedValue({
      user_id: "u1",
      display_name: null,
      birthday: null,
      gender: null,
      weight_unit: "lb",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    });
    vi.mocked(data.createItem).mockResolvedValue(item);
    const user = userEvent.setup();
    render(<ItemsView />);
    await screen.findByText(/no items yet/i);

    await user.click(screen.getByRole("button", { name: /add item/i }));
    await user.type(await screen.findByLabelText("Name"), "Passport");
    await user.type(screen.getByLabelText(/weight \(lb\)/i), "1");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() =>
      expect(data.createItem).toHaveBeenCalledWith(expect.objectContaining({ weightGrams: 454 })),
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
      expect(data.updateItem).toHaveBeenCalledWith("i1", {
        name: "Tee",
        defaultQty: 2,
        description: null,
        link: null,
        imageUrl: null,
        weightGrams: null,
        category: null,
      }),
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

  it("sets a category when creating an item", async () => {
    vi.mocked(data.listItems).mockResolvedValue([]);
    vi.mocked(data.createItem).mockResolvedValue(item);
    const user = userEvent.setup();
    render(<ItemsView />);
    await screen.findByText(/no items yet/i);

    await user.click(screen.getByRole("button", { name: /add item/i }));
    await user.type(await screen.findByLabelText("Name"), "Tee");
    await user.selectOptions(screen.getByLabelText("Category"), "clothing");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() =>
      expect(data.createItem).toHaveBeenCalledWith(
        expect.objectContaining({ category: "clothing" }),
      ),
    );
  });

  it("clears a category when editing an item", async () => {
    vi.mocked(data.listItems).mockResolvedValue([{ ...item, category: "clothing" }]);
    vi.mocked(data.updateItem).mockResolvedValue({ ...item, category: null });
    const user = userEvent.setup();
    render(<ItemsView />);
    await screen.findByText("Passport");

    await user.click(screen.getByRole("button", { name: /^edit$/i }));
    await user.selectOptions(await screen.findByLabelText("Category"), "");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() =>
      expect(data.updateItem).toHaveBeenCalledWith(
        "i1",
        expect.objectContaining({ category: null }),
      ),
    );
  });

  it("shows an item's category badge", async () => {
    vi.mocked(data.listItems).mockResolvedValue([{ ...item, category: "documents" }]);
    render(<ItemsView />);

    expect(await screen.findByText("Passport")).toBeInTheDocument();
    const row = screen.getByText("Passport").closest("tr");
    expect(within(row as HTMLElement).getByText("Documents & Money")).toBeInTheDocument();
  });

  it("filters items by category and clears the filter", async () => {
    vi.mocked(data.listItems).mockResolvedValue([
      { ...item, id: "i1", name: "Tee", category: "clothing" },
      { ...item, id: "i2", name: "Charger", category: "electronics" },
      { ...item, id: "i3", name: "Adapter", category: null },
    ]);
    const user = userEvent.setup();
    render(<ItemsView />);
    await screen.findByText("Tee");

    await user.click(screen.getByRole("button", { name: "Clothing" }));

    expect(screen.getByText("Tee")).toBeInTheDocument();
    expect(screen.queryByText("Charger")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "All" }));

    expect(screen.getByText("Charger")).toBeInTheDocument();
    expect(screen.getByText("Adapter")).toBeInTheDocument();
  });

  it("shows an empty state when the filtered category has no items", async () => {
    const clothing = { ...item, id: "i1", name: "Tee", category: "clothing" as const };
    const charger = { ...item, id: "i2", name: "Charger", category: "electronics" as const };
    vi.mocked(data.listItems)
      .mockResolvedValueOnce([clothing, charger])
      .mockResolvedValue([charger]);
    vi.mocked(data.deleteItem).mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<ItemsView />);
    await screen.findByText("Tee");

    await user.click(screen.getByRole("button", { name: "Clothing" }));
    expect(screen.queryByText("Charger")).not.toBeInTheDocument();

    const row = screen.getByText("Tee").closest("tr");
    await user.click(within(row as HTMLElement).getByRole("button", { name: /^delete$/i }));
    const confirm = await screen.findAllByRole("button", { name: /^delete$/i });
    await user.click(confirm[confirm.length - 1]);

    expect(await screen.findByText(/no items in this category/i)).toBeInTheDocument();
  });
});
