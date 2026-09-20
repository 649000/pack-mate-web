import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Trip } from "@/lib/types";

const params = vi.hoisted(() => ({ current: "" }));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(params.current),
}));

vi.mock("@/lib/data", () => ({
  listTrips: vi.fn(),
  createTrip: vi.fn(),
  updateTrip: vi.fn(),
  deleteTrip: vi.fn(),
  duplicateTrip: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

import { toast } from "sonner";
import * as data from "@/lib/data";
import { TripsView } from "./page";

const trip: Trip = {
  id: "t1",
  user_id: "u1",
  name: "Japan",
  destination: "Kyoto",
  country_code: "JP",
  start_date: "2026-03-01",
  end_date: "2026-03-10",
  created_at: "2026-01-01T00:00:00Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  params.current = "";
});

describe("TripsView", () => {
  it("shows an empty state when there are no trips", async () => {
    vi.mocked(data.listTrips).mockResolvedValue([]);
    render(<TripsView />);
    expect(await screen.findByText(/no trips yet/i)).toBeInTheDocument();
  });

  it("lists existing trips with their dates", async () => {
    vi.mocked(data.listTrips).mockResolvedValue([trip]);
    render(<TripsView />);
    expect(await screen.findByText("Japan")).toBeInTheDocument();
    expect(screen.getByText(/2026-03-01 to 2026-03-10/i)).toBeInTheDocument();
  });

  it("creates a trip from the dialog", async () => {
    vi.mocked(data.listTrips).mockResolvedValue([]);
    vi.mocked(data.createTrip).mockResolvedValue(trip);
    const user = userEvent.setup();
    render(<TripsView />);
    await screen.findByText(/no trips yet/i);

    await user.click(screen.getByRole("button", { name: /new trip/i }));
    await user.type(await screen.findByLabelText("Name"), "Japan");
    await user.selectOptions(screen.getByLabelText("Country"), "JP");
    await user.type(screen.getByLabelText("Destination"), "Kyoto");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() =>
      expect(data.createTrip).toHaveBeenCalledWith({
        name: "Japan",
        destination: "Kyoto",
        countryCode: "JP",
        startDate: null,
        endDate: null,
      }),
    );
  });

  it("blocks creating a trip without a country", async () => {
    vi.mocked(data.listTrips).mockResolvedValue([]);
    const user = userEvent.setup();
    render(<TripsView />);
    await screen.findByText(/no trips yet/i);

    await user.click(screen.getByRole("button", { name: /new trip/i }));
    await user.type(await screen.findByLabelText("Name"), "Nowhere");
    await user.click(screen.getByRole("button", { name: /^save$/i }));

    expect(data.createTrip).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("Select a country");
  });

  it("shows the destination and country name, never the raw code", async () => {
    vi.mocked(data.listTrips).mockResolvedValue([trip]);
    render(<TripsView />);
    await screen.findByText("Japan");

    expect(screen.getByText("Kyoto, Japan")).toBeInTheDocument();
    expect(screen.queryByText("JP")).not.toBeInTheDocument();
  });

  it("deletes a trip after confirmation", async () => {
    vi.mocked(data.listTrips).mockResolvedValue([trip]);
    vi.mocked(data.deleteTrip).mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<TripsView />);
    await screen.findByText("Japan");

    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    const confirm = await screen.findAllByRole("button", { name: /^delete$/i });
    await user.click(confirm[confirm.length - 1]);

    await waitFor(() => expect(data.deleteTrip).toHaveBeenCalledWith("t1"));
  });

  it("filters trips from the query parameter on first render", async () => {
    vi.mocked(data.listTrips).mockResolvedValue([trip, { ...trip, id: "t2", name: "Iceland" }]);
    params.current = "q=ice";
    render(<TripsView />);

    expect(await screen.findByText("Iceland")).toBeInTheDocument();
    expect(screen.queryByText("Japan")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Search trips")).toHaveValue("ice");
  });

  it("filters trips as the user types and restores them when cleared", async () => {
    vi.mocked(data.listTrips).mockResolvedValue([trip, { ...trip, id: "t2", name: "Iceland" }]);
    const user = userEvent.setup();
    render(<TripsView />);
    await screen.findByText("Japan");

    await user.type(screen.getByLabelText("Search trips"), "ice");
    expect(screen.getByText("Iceland")).toBeInTheDocument();
    expect(screen.queryByText("Japan")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /clear/i }));
    expect(screen.getByText("Japan")).toBeInTheDocument();
  });

  it("shows an empty state naming the query when nothing matches", async () => {
    vi.mocked(data.listTrips).mockResolvedValue([trip]);
    const user = userEvent.setup();
    render(<TripsView />);
    await screen.findByText("Japan");

    await user.type(screen.getByLabelText("Search trips"), "zzz");
    expect(screen.getByText(/no trips match .*zzz/i)).toBeInTheDocument();
  });

  it("duplicates a trip, prefilling the fields and clearing the dates", async () => {
    vi.mocked(data.listTrips).mockResolvedValue([trip]);
    vi.mocked(data.duplicateTrip).mockResolvedValue({ ...trip, id: "t2", name: "Japan (copy)" });
    const user = userEvent.setup();
    render(<TripsView />);
    await screen.findByText("Japan");

    await user.click(screen.getByRole("button", { name: /duplicate/i }));

    expect(await screen.findByLabelText("Name")).toHaveValue("Japan (copy)");
    expect(screen.getByLabelText("Country")).toHaveValue("JP");
    expect(screen.getByLabelText("Destination")).toHaveValue("Kyoto");
    expect(screen.getByLabelText("Start date")).toHaveValue("");
    expect(screen.getByLabelText("End date")).toHaveValue("");

    await user.click(screen.getByRole("button", { name: /create copy/i }));

    await waitFor(() =>
      expect(data.duplicateTrip).toHaveBeenCalledWith("t1", {
        name: "Japan (copy)",
        destination: "Kyoto",
        countryCode: "JP",
        startDate: null,
        endDate: null,
      }),
    );
  });

  it("does not duplicate a trip when the prompt is cancelled", async () => {
    vi.mocked(data.listTrips).mockResolvedValue([trip]);
    const user = userEvent.setup();
    render(<TripsView />);
    await screen.findByText("Japan");

    await user.click(screen.getByRole("button", { name: /duplicate/i }));
    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(data.duplicateTrip).not.toHaveBeenCalled();
  });

  it("blocks duplicating a trip without a country", async () => {
    vi.mocked(data.listTrips).mockResolvedValue([trip]);
    const user = userEvent.setup();
    render(<TripsView />);
    await screen.findByText("Japan");

    await user.click(screen.getByRole("button", { name: /duplicate/i }));
    await user.selectOptions(screen.getByLabelText("Country"), "");
    await user.click(screen.getByRole("button", { name: /create copy/i }));

    expect(data.duplicateTrip).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith("Select a country");
  });
});
