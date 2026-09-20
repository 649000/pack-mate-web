import type { DestinationFacts } from "./types";

// The display city for an IANA zone id: "America/Los_Angeles" -> "Los Angeles".
export function zoneCity(zone: string): string {
  const segment = zone.split("/").pop() ?? zone;
  return segment.replace(/_/g, " ");
}

// Offset of a zone from UTC, in minutes, at a given instant.
export function zoneOffsetMinutes(zone: string, at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    timeZoneName: "longOffset",
  }).formatToParts(at);
  const value = parts.find((part) => part.type === "timeZoneName")?.value ?? "GMT";
  const match = value.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3] ?? 0));
}

export function formatDifference(differenceMinutes: number): string {
  if (differenceMinutes === 0) return "same time";
  const ahead = differenceMinutes > 0;
  const abs = Math.abs(differenceMinutes);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(hours === 1 ? "1 hour" : `${hours} hours`);
  if (minutes > 0) parts.push(minutes === 1 ? "1 minute" : `${minutes} minutes`);
  return `${parts.join(" ")} ${ahead ? "ahead" : "behind"}`;
}

// The symbol for an ISO 4217 code, derived from the platform's locale data.
export function currencySymbol(code: string | null): string | null {
  if (!code) return null;
  try {
    const parts = new Intl.NumberFormat("en", {
      style: "currency",
      currency: code,
    }).formatToParts(0);
    const symbol = parts.find((part) => part.type === "currency")?.value ?? null;
    // Intl falls back to the code itself for currencies it does not know.
    return symbol === null || symbol === code ? null : symbol;
  } catch {
    return null;
  }
}

export type TimeZoneInfo = {
  zone: string;
  city: string;
  differenceMinutes: number;
  differenceLabel: string;
  localTime: string;
};

function localTime(zone: string, at: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: zone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(at);
}

function matchZone(zones: string[], destination: string | null): string | null {
  const text = (destination ?? "").trim().toLowerCase();
  if (text.length === 0) return null;
  for (const zone of zones) {
    const city = zoneCity(zone).toLowerCase();
    if (city.length >= 3 && text.includes(city)) return zone;
  }
  return null;
}

function toInfo(zone: string, at: Date, viewerZone: string): TimeZoneInfo {
  const differenceMinutes = zoneOffsetMinutes(zone, at) - zoneOffsetMinutes(viewerZone, at);
  return {
    zone,
    city: zoneCity(zone),
    differenceMinutes,
    differenceLabel: formatDifference(differenceMinutes),
    localTime: localTime(zone, at),
  };
}

// The instant used to compute offsets: the trip's start date when it has one,
// otherwise now. Midday UTC avoids date-boundary surprises.
export function referenceDate(startDate: string | null, now: Date = new Date()): Date {
  if (!startDate) return now;
  const parsed = new Date(`${startDate}T12:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? now : parsed;
}

// Resolve the time zones to show: the one whose city the destination names,
// otherwise all of the country's zones. A single-zone country always shows one.
export function resolveTimeZones({
  facts,
  destination,
  at,
  viewerZone,
}: {
  facts: DestinationFacts;
  destination: string | null;
  at: Date;
  viewerZone?: string;
}): TimeZoneInfo[] {
  const zones = facts.timezones;
  if (zones.length === 0) return [];
  const viewer = viewerZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const matched = zones.length > 1 ? matchZone(zones, destination) : null;
  const chosen = matched ? [matched] : zones;
  return chosen.map((zone) => toInfo(zone, at, viewer));
}
