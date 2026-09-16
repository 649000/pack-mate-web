## Why

The application validates names and weights in `lib/validation.ts`, but the database does not enforce the same rules. A direct PostgREST call bypasses the app layer, so a name can be any length and a weight can exceed the documented maximum even though the specs promise rejection. The database is the security and integrity boundary; it should enforce the same limits the app does.

## What Changes

- Cap the length of every user-supplied name at 200 characters, enforced in the shared validator and by a database check constraint. Applies to library items, library bags, trips, trip bags and trip entries.
- Enforce the existing weight ceiling (100000 g) in the database, mirroring `MAX_WEIGHT_GRAMS`, for item weight, trip entry weight, bag weight limit and trip bag weight limit.
- Update the affected specs so the limits are stated behavior rather than implementation detail.

No UI behavior changes beyond over-long names now being rejected with a clear message.

## Capabilities

### New Capabilities
<!-- None. -->

### Modified Capabilities
- `items`: item name has a maximum length; the weight ceiling is enforced at the database boundary.
- `bags`: bag name has a maximum length; the weight limit ceiling is enforced at the database boundary.
- `trips`: trip name has a maximum length.
- `packing-lists`: trip bag and trip entry names have a maximum length; trip entry and trip bag weights respect the ceiling.

## Impact

- `lib/validation.ts` — add a shared name maximum and enforce it in `validateName`.
- `supabase/migrations/` — one new migration adding name-length and weight-ceiling check constraints.
- `openspec/specs/` — `items`, `bags`, `trips`, `packing-lists` requirements updated.
- Tests — unit coverage for the name maximum; integration coverage asserting the database rejects over-long names and over-ceiling weights.
