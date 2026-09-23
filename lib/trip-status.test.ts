import { afterAll, describe, expect, it } from "vitest";
import { departureCountdown, formatTripDates, tripLength } from "./trip-status";

// The countdown is deliberately local-calendar. Run this file at a negative
// UTC offset so an implementation that used the UTC day would be caught.
const originalTz = process.env.TZ;
process.env.TZ = "America/New_York";

afterAll(() => {
  if (originalTz === undefined) delete process.env.TZ;
  else process.env.TZ = originalTz;
});

function localNoon(year: number, month: number, day: number): Date {
  return new Date(year, month - 1, day, 12, 0, 0);
}

describe("departureCountdown", () => {
  it("returns none when there is no start date", () => {
    expect(departureCountdown(null, "2026-05-10", localNoon(2026, 1, 1))).toEqual({ kind: "none" });
  });

  it("returns none for an invalid start date", () => {
    expect(departureCountdown("not-a-date", null, localNoon(2026, 1, 1))).toEqual({ kind: "none" });
  });

  it("counts days before departure", () => {
    expect(departureCountdown("2026-01-11", null, localNoon(2026, 1, 1))).toEqual({
      kind: "before",
      days: 10,
    });
  });

  it("reports leaving today on the start date", () => {
    expect(departureCountdown("2026-01-10", "2026-01-20", localNoon(2026, 1, 10))).toEqual({
      kind: "today",
    });
  });

  it("reports the day and total while in progress", () => {
    expect(departureCountdown("2026-01-10", "2026-01-20", localNoon(2026, 1, 12))).toEqual({
      kind: "inProgress",
      day: 3,
      total: 11,
    });
  });

  it("reports the day without a total when no end date is set", () => {
    expect(departureCountdown("2026-01-10", null, localNoon(2026, 1, 12))).toEqual({
      kind: "inProgress",
      day: 3,
      total: null,
    });
  });

  it("treats the end date as the last day of the trip", () => {
    expect(departureCountdown("2026-01-10", "2026-01-20", localNoon(2026, 1, 20))).toEqual({
      kind: "inProgress",
      day: 11,
      total: 11,
    });
  });

  it("reports the trip as ended after the end date", () => {
    expect(departureCountdown("2026-01-10", "2026-01-20", localNoon(2026, 1, 21))).toEqual({
      kind: "ended",
    });
  });

  it("uses the viewer's local calendar day, not the UTC day", () => {
    // 23:30 local on 2026-01-10 is already 2026-01-11 in UTC at this offset.
    const lateLocal = new Date(2026, 0, 10, 23, 30);
    expect(departureCountdown("2026-01-11", null, lateLocal)).toEqual({ kind: "before", days: 1 });
  });

  it("ignores an end date that is before the start date", () => {
    expect(departureCountdown("2026-01-20", "2026-01-10", localNoon(2026, 1, 22))).toEqual({
      kind: "inProgress",
      day: 3,
      total: null,
    });
  });
});

describe("tripLength", () => {
  it("counts inclusive days and the nights between them", () => {
    expect(tripLength("2025-10-12", "2025-10-19")).toEqual({ days: 8, nights: 7 });
  });

  it("reports a single-day trip with no nights", () => {
    expect(tripLength("2025-10-12", "2025-10-12")).toEqual({ days: 1, nights: 0 });
  });

  it("returns null unless both dates are valid and ordered", () => {
    expect(tripLength("2025-10-12", null)).toBeNull();
    expect(tripLength(null, "2025-10-19")).toBeNull();
    expect(tripLength("2025-10-19", "2025-10-12")).toBeNull();
    expect(tripLength("not-a-date", "2025-10-19")).toBeNull();
  });
});

describe("formatTripDates", () => {
  it("formats a range in UTC so the picked day is shown", () => {
    expect(formatTripDates("2025-10-12", "2025-10-19")).toBe("12 Oct 2025 – 19 Oct 2025");
  });

  it("falls back to whichever single date is present", () => {
    expect(formatTripDates("2025-10-12", null)).toBe("12 Oct 2025");
    expect(formatTripDates(null, "2025-10-19")).toBe("19 Oct 2025");
  });

  it("returns null when there are no usable dates", () => {
    expect(formatTripDates(null, null)).toBeNull();
    expect(formatTripDates("nope", "also-nope")).toBeNull();
  });
});
