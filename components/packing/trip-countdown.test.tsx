import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TripCountdown, countdownLabel } from "./trip-countdown";

describe("countdownLabel", () => {
  it("formats every countdown state", () => {
    expect(countdownLabel({ kind: "none" })).toBeNull();
    expect(countdownLabel({ kind: "before", days: 3 })).toBe("3 days until departure");
    expect(countdownLabel({ kind: "before", days: 1 })).toBe("1 day until departure");
    expect(countdownLabel({ kind: "today" })).toBe("Leaving today");
    expect(countdownLabel({ kind: "inProgress", day: 2, total: 9 })).toBe("Day 2 of 9");
    expect(countdownLabel({ kind: "inProgress", day: 2, total: null })).toBe("Day 2");
    expect(countdownLabel({ kind: "ended" })).toBe("Trip ended");
  });
});

describe("TripCountdown", () => {
  it("renders the countdown for a trip with a start date", () => {
    render(<TripCountdown startDate="2026-01-11" endDate={null} now={new Date(2026, 0, 1, 12)} />);
    expect(screen.getByText("10 days until departure")).toBeInTheDocument();
  });

  it("renders nothing when there is no start date", () => {
    const { container } = render(
      <TripCountdown startDate={null} endDate={null} now={new Date(2026, 0, 1)} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
