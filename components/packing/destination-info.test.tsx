import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

const getDestinationFacts = vi.hoisted(() => vi.fn());

vi.mock("@/lib/data", () => ({ getDestinationFacts }));

import { DestinationInfo } from "./destination-info";
import type { DestinationFacts } from "@/lib/types";

const US_FACTS: DestinationFacts = {
  country_code: "US",
  currency_code: "USD",
  calling_code: "+1",
  plug_types: ["A", "B"],
  voltage: "120",
  frequency: "60",
  timezones: ["America/Los_Angeles", "America/New_York"],
  updated_at: "2026-01-01T00:00:00Z",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("DestinationInfo", () => {
  it("shows power, currency, calling code and time zones", async () => {
    getDestinationFacts.mockResolvedValue(US_FACTS);

    render(<DestinationInfo countryCode="US" destination="Los Angeles" startDate="2026-01-15" />);

    await waitFor(() => expect(screen.getByText("Destination info")).toBeInTheDocument());
    expect(screen.getByAltText("Type A plug")).toBeInTheDocument();
    expect(screen.getByAltText("Type B plug")).toBeInTheDocument();
    expect(screen.getByText("120 V · 60 Hz")).toBeInTheDocument();
    expect(screen.getByText("USD $")).toBeInTheDocument();
    expect(screen.getByText("+1")).toBeInTheDocument();
    expect(screen.getByText(/Los Angeles/)).toBeInTheDocument();
  });

  it("lists every zone when the destination matches no city", async () => {
    getDestinationFacts.mockResolvedValue(US_FACTS);

    render(<DestinationInfo countryCode="US" destination="San Francisco" startDate="2026-01-15" />);

    await waitFor(() => expect(screen.getByText(/Los Angeles/)).toBeInTheDocument());
    expect(screen.getByText(/New York/)).toBeInTheDocument();
  });

  it("renders nothing while loading", () => {
    getDestinationFacts.mockReturnValue(new Promise(() => {}));
    const { container } = render(
      <DestinationInfo countryCode="US" destination="Kyoto" startDate={null} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when the facts cannot be loaded", async () => {
    getDestinationFacts.mockRejectedValue(new Error("offline"));
    const { container } = render(
      <DestinationInfo countryCode="US" destination="Kyoto" startDate={null} />,
    );
    await waitFor(() => expect(getDestinationFacts).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when the country has no facts", async () => {
    getDestinationFacts.mockResolvedValue(null);
    const { container } = render(
      <DestinationInfo countryCode="ZZ" destination={null} startDate={null} />,
    );
    await waitFor(() => expect(getDestinationFacts).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when the facts are empty", async () => {
    getDestinationFacts.mockResolvedValue({
      country_code: "AQ",
      currency_code: null,
      calling_code: null,
      plug_types: [],
      voltage: null,
      frequency: null,
      timezones: [],
      updated_at: "2026-01-01T00:00:00Z",
    });
    const { container } = render(
      <DestinationInfo countryCode="AQ" destination={null} startDate={null} />,
    );
    await waitFor(() => expect(getDestinationFacts).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });
});
