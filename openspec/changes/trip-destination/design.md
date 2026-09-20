## Context

See `proposal.md` - Why. Current state that shapes the approach:

- `packmate.trips` holds `name`, `start_date`, `end_date`. Destination is trip metadata; the packing list inherits it (`trip_bags` / `trip_entries` hang off the trip).
- The project treats the database as the integrity boundary: name and weight limits are mirrored as `check` constraints (`20260917000000_name_and_weight_limits.sql`), and fixed sets such as `category` are `check`-constrained (`20260915040000_item_categories.sql`).
- There is no backend. Data access is Supabase PostgREST under RLS; `get_shared_trip` is a `security definer` SQL function that returns a versioned `jsonb` payload (`v: 1`).
- `lib/packing.ts` already exports a type named `Destination`, meaning an entry's move target (`loose | with_me | bag:<id>`). The trip field needs a name that does not collide.
- The change is additive and there is no existing trip data, so no backfill is required.

## Goals / Non-Goals

**Goals:**

- Capture a destination on a trip: an optional place label and a required country.
- Keep the country machine-usable (stable code) while showing users only its name.
- Keep the change small, additive and reversible.

**Non-Goals:**

- Geocoding, coordinates, timezone, weather, recommendations, multi-stop itineraries.
- Changing the packing list, bags or entries.
- Renaming the existing `Destination` move-target type.

## Decisions

### Destination lives on `trips`, not a child table

One destination per trip, stored as two columns on `packmate.trips`. A `trip_destinations` table only pays off for itineraries, which are explicitly out of scope. Migration to a child table later is mechanical (one row per trip).

### Country stored as ISO 3166-1 alpha-2, shown by name

Store `country_code` (e.g. `JP`); never render the code. A single static module, `lib/countries.ts`, holds `{ code, name }` entries and serves three roles: picker options, code-to-name display, and application-side validation. No new dependency. Alternative considered: a `countries` reference table in Postgres. Rejected — it still needs a mirrored TS list for the picker, and adds a table for static data.

### Country required, destination optional

`country_code` is `not null`; `destination` is nullable with a trimmed `1..200` length check when set, mirroring the trip-name constraint. Existing rows are unaffected because there is no existing data. Alternative considered: make the country optional too. Rejected per the product decision that every trip must have at least a country.

### Database enforces both fields

- `country_code text not null` plus `check (country_code in (...))` over the ISO alpha-2 list.
- `destination text` plus `check (destination is null or length(btrim(destination)) between 1 and 200)`.

This follows the existing category and name-limit precedents so a write that bypasses the app cannot store an unknown country or an over-long destination.

### Share payload gains the fields and bumps to `v: 2`

`get_shared_trip` selects `destination` and `country_code` and adds them to the `trip` object, incrementing `v` from `1` to `2`. The shared client maps the code to a name via `lib/countries.ts`. `SharedTrip` in `lib/types.ts` gains the two fields. The version bump signals the shape change to any cached consumer.

### Keep the existing `Destination` type; disambiguate by name

Do not rename `lib/packing.ts` `Destination` in this change. The trip field is referred to as the trip's destination/country, and its column names (`destination`, `country_code`) do not collide with the move-target type at the SQL or property level.

## Risks / Trade-offs

- **Country list duplicated in TypeScript and SQL** → they can drift. Mitigate with a unit test that asserts the codes in `lib/countries.ts` match the set in the migration's constraint.
- **A ~249-value `check` constraint is verbose** → accepted for consistency with the project's "database is the integrity boundary" rule. A lookup table can replace it later without changing behavior.
- **`lib/pdf.ts` is also edited by the in-flight `export-packing-list-pdf` change** → sequence this change after that one, or coordinate the small `PdfTrip` addition to avoid a conflict.
- **Country-level weather is coarse** → expected and accepted; the optional destination label and future coordinates refine it. Not a blocker for capturing data now.

## Migration Plan

1. Add one migration that adds the two columns and constraints to `packmate.trips`, and `create or replace`s `get_shared_trip` with the new fields and `v: 2`.
2. No backfill: no existing trip data.
3. Rollback: drop the two columns and restore the previous `get_shared_trip` definition.

## Open Questions

- Whether a `countries` lookup table should replace the `check` constraint once more country-level features exist.
- Whether the country picker should be a plain `select` or a searchable combobox; both satisfy the spec and can be decided during implementation.
