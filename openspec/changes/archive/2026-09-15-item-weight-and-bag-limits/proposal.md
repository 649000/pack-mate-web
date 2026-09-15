## Why

General travellers face per-bag airline baggage limits, but Pack Mate has no notion of weight. A traveller cannot tell whether a bag is over the allowance until the airport. Weight is the one LighterPack idea that translates directly to general travel.

## What Changes

- Add an optional weight to reusable items and trip entries, entered and displayed in kg or lb but stored canonically in grams.
- Add an optional default weight limit to library bags, copied onto trip bags when added to a trip.
- Show each trip bag's weight against its limit, and the trip's total baggage weight.
- Add a weight-unit preference to the account profile, with a temporary unit toggle on the trip view.
- Define bag weight as the sum of its entries' unit weight times quantity; items marked With Me or unassigned do not count toward baggage.
- No worn, consumable, or star.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `items`: reusable items gain an optional weight.
- `bags`: library bags gain an optional default weight limit.
- `packing-lists`: trip bags show weight against a limit; the trip shows total baggage weight; a unit toggle is available.
- `account`: the user can choose a preferred weight unit.

## Impact

- Database: `weight_grams` on `reusable_items` and `trip_entries`; `weight_limit_grams` on `reusable_bags` and `trip_bags`; `weight_unit` on `packmate.profiles`. Both copy RPCs updated. RLS unchanged.
- Code: `lib/types.ts`, `lib/data.ts`, `lib/validation.ts`, new `lib/weight.ts`, `app/(app)/items`, `app/(app)/bags`, `app/(app)/trip`, `app/(app)/account`.
- Tests: unit (conversions, aggregation, validation), integration (weight/limit copy), e2e (weight flow).
- No new dependencies; no new service; no cost change.
