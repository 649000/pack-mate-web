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
