import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ShareLink, Trip } from "@/lib/types";

vi.mock("@/lib/data", () => ({
  listShareLinks: vi.fn(),
  listTrips: vi.fn(),
  regenerateShareLink: vi.fn(),
  revokeShareLink: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import * as data from "@/lib/data";
import { SharesView } from "./page";

const TOKEN = "a".repeat(64);

const trip: Trip = {
  id: "t1",
  user_id: "u1",
  name: "Japan",
  start_date: null,
  end_date: null,
  created_at: "2026-01-01T00:00:00Z",
};

const activeLink: ShareLink = {
  id: "s1",
  trip_id: "t1",
  user_id: "u1",
  token: TOKEN,
  created_at: "2026-09-14T00:00:00.000Z",
  expires_at: "2026-10-14T00:00:00.000Z",
  revoked_at: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(data.listTrips).mockResolvedValue([trip]);
});

describe("SharesView", () => {
  it("shows an empty state when there are no links", async () => {
    vi.mocked(data.listShareLinks).mockResolvedValue([]);
    render(<SharesView />);
    expect(await screen.findByText(/no shared links yet/i)).toBeInTheDocument();
  });

  it("lists links with the trip name, dates and status", async () => {
    vi.mocked(data.listShareLinks).mockResolvedValue([activeLink]);
    render(<SharesView />);

    expect(await screen.findByText("Japan")).toBeInTheDocument();
    expect(screen.getByText("2026-09-14")).toBeInTheDocument();
    expect(screen.getByText("2026-10-14")).toBeInTheDocument();
    expect(screen.getByText("active")).toBeInTheDocument();
  });

  it("copies the share URL", async () => {
    vi.mocked(data.listShareLinks).mockResolvedValue([activeLink]);
    const user = userEvent.setup();
    render(<SharesView />);
    await screen.findByText("Japan");

    await user.click(screen.getByRole("button", { name: /^copy$/i }));

    await waitFor(async () => {
      expect(await navigator.clipboard.readText()).toContain(`/share?t=${TOKEN}`);
    });
  });

  it("regenerates a link and refreshes the list", async () => {
    vi.mocked(data.listShareLinks).mockResolvedValue([activeLink]);
    vi.mocked(data.regenerateShareLink).mockResolvedValue({
      ...activeLink,
      id: "s2",
      token: "b".repeat(64),
    });
    const user = userEvent.setup();
    render(<SharesView />);
    await screen.findByText("Japan");

    await user.click(screen.getByRole("button", { name: /regenerate/i }));

    await waitFor(() => expect(data.regenerateShareLink).toHaveBeenCalledWith("s1"));
    expect(data.listShareLinks).toHaveBeenCalledTimes(2);
  });

  it("revokes a link and refreshes the list", async () => {
    vi.mocked(data.listShareLinks).mockResolvedValue([activeLink]);
    vi.mocked(data.revokeShareLink).mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<SharesView />);
    await screen.findByText("Japan");

    await user.click(screen.getByRole("button", { name: /revoke/i }));

    await waitFor(() => expect(data.revokeShareLink).toHaveBeenCalledWith("s1"));
    expect(data.listShareLinks).toHaveBeenCalledTimes(2);
  });

  it("disables regenerate and revoke for a revoked link", async () => {
    vi.mocked(data.listShareLinks).mockResolvedValue([
      { ...activeLink, revoked_at: "2026-09-15T00:00:00.000Z" },
    ]);
    render(<SharesView />);
    await screen.findByText("Japan");

    expect(screen.getByText("revoked")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /regenerate/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /revoke/i })).toBeDisabled();
  });
});
