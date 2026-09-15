## Context

See `proposal.md` for motivation and the spec deltas under `specs/` for the behavior contract.

Relevant current state:

- Weight is a per-item property, so it lives on the library item and is copied to the trip entry, consistent with the existing copy-on-add model (`supabase/migrations/20260914000000_packing_list_foundation.sql:329` and `:382`).
- A trip entry already has a quantity (`qty`), so weight must multiply by quantity.
- A trip entry's location is `trip_bag_id`, `is_with_me`, or neither; `lib/packing.ts` already groups entries by bag.
- `packmate.profiles` (`supabase/migrations/20260914010000_profiles.sql:7`) already stores per-user preferences and is the natural home for a unit preference.

## Goals / Non-Goals

**Goals:**

- Show whether each bag is within its allowance, and the trip's total baggage weight.
- Store weight once in a canonical unit so sums are exact and unit changes are display-only.
- Keep the copy-on-add boundary intact for weight and limits.

**Non-Goals:**

- Base / worn / consumable weight splits (LighterPack concepts not relevant to general travel).
- Per-trip weight limits (limits are per bag).
- Unit conversion libraries or new dependencies.

## Decisions

### Store canonical grams, display in the preferred unit

`weight_grams numeric` (nullable) on items and entries; `weight_limit_grams numeric` on bags. The profile holds `weight_unit` (`kg` | `lb`).

- Rationale: one source of truth makes aggregation exact and keeps the unit a pure display concern. Rounding only happens at display.
- Alternative considered: store value + unit per item (LighterPack). Rejected because every sum then has to normalize, inviting mixed-unit bugs.

### Weight is per unit; totals multiply by quantity

An entry's contribution is `weight_grams * qty`.

- Rationale: matches the existing quantity semantics and the reusable library, where weight describes one unit.
- Alternative considered: store a total weight per entry. Rejected because it duplicates quantity and breaks reuse.

### Per-bag limit only

`weight_limit_grams` on `reusable_bags` (default) and `trip_bags` (copied).

- Rationale: airline allowances are per bag. A trip-level limit adds a concept without a clear need.
- Alternative considered: a trip-level total limit. Deferred; can be added later without rework.

### Unit preference on the profile, ephemeral toggle on the trip

The saved unit lives on `packmate.profiles`. The trip view offers a toggle that changes only the current view.

- Rationale: a traveller usually keeps one unit; the toggle covers a one-off need without another persisted column or a migration.
- Alternative considered: persist the unit per trip (`trips.weight_unit`). Rejected as unnecessary for now.

### Pure weight module

New `lib/weight.ts` with conversions (`toGrams`, `fromGrams`), formatting (`formatWeight`), and aggregation (`sumEntryWeight`, `sumBagWeight`, `tripBaggageTotal`, `isOverLimit`, `isWeightComplete`).

- Rationale: keeps arithmetic out of components and makes it unit-testable.
- Alternative considered: inline math in the trip view. Rejected for testability.

### Bag weight excludes With Me and unassigned; missing weights mark the total incomplete

Only entries inside a bag count toward that bag's weight. A bag's total sums entries that have a weight and is flagged incomplete if any contained entry lacks one.

- Rationale: baggage weight is what is physically in a bag; an incomplete total must not read as final.
- Alternative considered: treat missing weights as zero silently. Rejected because it hides an under-count.

## Risks / Trade-offs

- **Rounding drift across units** — lb/oz input converted to grams and back can look off by a gram → round to whole grams on write and format consistently through `formatWeight`.
- **Copy path drift** — the RPCs must copy `weight_grams` and `weight_limit_grams` → cover with integration tests.
- **Incomplete totals mislead** — users may trust a partial sum → the incomplete marker is required by the spec.
- **Defaults on existing rows** — new columns are nullable and `weight_unit` defaults to `kg`, so existing profiles and rows remain valid.
- **Floating point** — `numeric` avoids binary float error; app-side math uses a single conversion constant set.

## Migration Plan

1. Add nullable `weight_grams` to `reusable_items` and `trip_entries`; `weight_limit_grams` to `reusable_bags` and `trip_bags`; `weight_unit text not null default 'kg'` to `packmate.profiles`, all with checks.
2. `create or replace` both copy functions to carry the new columns.
3. Deploy app changes (weight module, types, data, UI).
4. Rollback: drop the new columns and restore the previous function definitions.

## Open Questions

- None.
