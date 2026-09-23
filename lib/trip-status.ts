export type DepartureCountdown =
  | { kind: "none" }
  | { kind: "before"; days: number }
  | { kind: "today" }
  | { kind: "inProgress"; day: number; total: number | null }
  | { kind: "ended" };

const DAY_MS = 24 * 60 * 60 * 1000;

// Parse a `YYYY-MM-DD` date into a whole-day number, independent of time zone.
// Returns null for anything that is not a real calendar date.
function parseCalendarDay(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = Date.UTC(year, month - 1, day);
  const date = new Date(utc);
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return Math.floor(utc / DAY_MS);
}

// The viewer's current calendar day, taken from local date parts so the
// countdown matches the day the user is actually living in rather than the UTC
// day, which would be off by one for part of the day outside UTC.
function localCalendarDay(now: Date): number {
  return Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / DAY_MS);
}

export function departureCountdown(
  startDate: string | null,
  endDate: string | null,
  now: Date = new Date(),
): DepartureCountdown {
  if (!startDate) return { kind: "none" };
  const start = parseCalendarDay(startDate);
  if (start === null) return { kind: "none" };

  const today = localCalendarDay(now);
  if (today < start) return { kind: "before", days: start - today };
  if (today === start) return { kind: "today" };

  // Ignore an end date that is malformed or before the start date, so bad data
  // still yields a sensible state instead of an impossible one.
  const parsedEnd = endDate ? parseCalendarDay(endDate) : null;
  const end = parsedEnd !== null && parsedEnd >= start ? parsedEnd : null;
  if (end !== null && today > end) return { kind: "ended" };

  return {
    kind: "inProgress",
    day: today - start + 1,
    total: end !== null ? end - start + 1 : null,
  };
}

// Inclusive trip length in days, plus the number of nights (one fewer). Null
// unless both dates are present and the end is not before the start.
export function tripLength(
  startDate: string | null,
  endDate: string | null,
): { days: number; nights: number } | null {
  if (!startDate || !endDate) return null;
  const start = parseCalendarDay(startDate);
  const end = parseCalendarDay(endDate);
  if (start === null || end === null || end < start) return null;
  const days = end - start + 1;
  return { days, nights: days - 1 };
}

// Fixed to UTC so a `YYYY-MM-DD` trip date renders as the day the user picked,
// regardless of the viewer's time zone.
const tripDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function formatCalendarDay(value: string): string | null {
  const day = parseCalendarDay(value);
  if (day === null) return null;
  return tripDateFormatter.format(new Date(day * DAY_MS));
}

// Human date range for a trip header, e.g. "12 Oct 2025 – 19 Oct 2025".
export function formatTripDates(startDate: string | null, endDate: string | null): string | null {
  const start = startDate ? formatCalendarDay(startDate) : null;
  const end = endDate ? formatCalendarDay(endDate) : null;
  if (start && end) return `${start} – ${end}`;
  return start ?? end;
}
