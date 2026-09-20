import { departureCountdown, type DepartureCountdown } from "@/lib/trip-status";

export function countdownLabel(countdown: DepartureCountdown): string | null {
  switch (countdown.kind) {
    case "none":
      return null;
    case "before":
      return countdown.days === 1
        ? "1 day until departure"
        : `${countdown.days} days until departure`;
    case "today":
      return "Leaving today";
    case "inProgress":
      return countdown.total !== null
        ? `Day ${countdown.day} of ${countdown.total}`
        : `Day ${countdown.day}`;
    case "ended":
      return "Trip ended";
  }
}

export function TripCountdown({
  startDate,
  endDate,
  now,
  className,
}: {
  startDate: string | null;
  endDate: string | null;
  now?: Date;
  className?: string;
}) {
  const label = countdownLabel(departureCountdown(startDate, endDate, now));
  if (!label) return null;
  return (
    <span className={className} data-testid="trip-countdown">
      {label}
    </span>
  );
}
