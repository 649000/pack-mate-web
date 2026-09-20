## Why

A packing list has no sense of where the trip is going. Capturing a destination now is the foundation for future destination-aware features (temperature-based packing, item recommendations) without building those features yet.

## What Changes

- Add an optional free-text destination to a trip: the place, such as "Kyoto".
- Add a required country to a trip, stored as an ISO 3166-1 alpha-2 code. **BREAKING**: creating or editing a trip now requires selecting a country.
- Show the country's **name** (never the raw code) next to the destination wherever trip metadata appears: the trips list, the trip header, the PDF export, and the public shared view.
- Validate the country against a static, bundled country list in both the application and the database.
- Explicitly out of scope: geocoding, coordinates, timezone, multi-stop itineraries, weather and recommendations. This change only captures the destination so those can be built later without re-modelling.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `trips`: a trip gains an optional destination and a required country; trip creation and editing require a country.
- `sharing`: the shared view shows the trip's destination and country.

## Impact

- **Database**: new migration adding `destination` (nullable, trimmed 1..200 when set) and `country_code` (not null, ISO alpha-2) to `packmate.trips`, with a validity check on the code. `packmate.get_shared_trip` gains the two fields and its payload version moves from `v: 1` to `v: 2`.
- **Data layer**: `Trip` and `SharedTrip` in `lib/types.ts`; `createTrip`/`updateTrip` in `lib/data.ts`; validation in `lib/validation.ts`.
- **New module**: `lib/countries.ts` — a static `{ code, name }` list used for the picker, code-to-name display, and validation. No new dependency.
- **UI**: `app/(app)/trips/page.tsx` (create/edit form and list column) and `app/(app)/trip/page.tsx` (header).
- **Sharing**: shared view component reads the new payload fields.
- **PDF**: `lib/pdf.ts` trip line. Coordinate with the in-flight `export-packing-list-pdf` change, which also edits `lib/pdf.ts`.
- **Tests**: unit tests for country validation and formatting, integration tests for the new constraint, and UI coverage for the required field and empty states.
