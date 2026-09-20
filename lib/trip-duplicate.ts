import type { TripInput } from "./data";
import type { Trip } from "./types";

// Initial values for the duplicate prompt: the source trip's name, country and
// destination are prefilled as editable defaults, while the dates are left
// empty so a copy never inherits stale dates.
export function duplicateTripDefaults(trip: Trip): TripInput {
  return {
    name: `${trip.name} (copy)`,
    destination: trip.destination,
    countryCode: trip.country_code,
    startDate: null,
    endDate: null,
  };
}
