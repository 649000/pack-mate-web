## Context

See `proposal.md` for motivation and `specs/` for the behavior contract.

Relevant current state:

- Optional item metadata (`description`, `link`, `image_url`) was added by `supabase/migrations/20260915000000_item_metadata.sql`, which sets the pattern: nullable column + check constraint on both `packmate.reusable_items` and `packmate.trip_entries`, then `create or replace` on the two copy functions to carry the new columns.
- The copy functions are `packmate.add_library_bag_to_trip` and `packmate.add_library_item_to_trip` (same migration). Both are `security invoker` and verify trip/bag/item ownership.
- The public share payload is built by `packmate.get_shared_trip` (`supabase/migrations/20260915030000_share_links.sql:89`), which returns an **explicit** `jsonb_build_object` projection per entry. A new column is invisible to the share unless added there.
- `lib/types.ts` defines `EntryLike` as the minimal shape the packing and weight helpers accept; `SharedTripEntry` extends it with the detail fields. Any helper that needs a category must see it through one of these shapes.
- `lib/weight.ts` sums weight from `{ weight_grams, qty }`; `sumBagWeight` and `tripBaggageTotal` deliberately exclude With Me and unassigned entries from the baggage total.
- The `sharing` capability is introduced by the in-flight `public-share-links` change and is not yet in `openspec/specs/`. This change's `sharing` delta assumes that change archives first.

## Goals / Non-Goals

**Goals:**

- Add one optional, validated, fixed-set category to reusable items and trip entries with minimal new concepts.
- Make the category a filter and a weight lens, never a second structural hierarchy.
- Keep the copy and share projections explicit so no field leaks by accident.
- Keep the whole change testable at the unit, data and RLS levels.

**Non-Goals:**

- User-defined categories or any category management UI.
- Grouping or dragging entries by category; the bag tree remains the only structure.
- Backfilling existing items; uncategorised is a valid steady state.
- Per-category weight limits or airline presets.

## Decisions

### Fixed set stored as `text` + check constraint

`category text` nullable on both tables, constrained to the 20 keys. Rationale: matches the existing metadata pattern, is readable in queries and exports, and is easy to extend with a later `alter ... drop/add constraint`. Alternatives considered: a Postgres enum type (harder to evolve, needs `alter type`), and a lookup table (adds a join and seed data for a set the app also needs as a constant). The trade-off is that the set is duplicated between `lib/validation.ts` and the SQL constraint; a test asserts the two agree.

### `null` means uncategorised; no "Other"

Rationale: with a broad set, an explicit "Other" duplicates the unset state and forces a choice. One nullable concept is simpler. Alternatives considered: a sentinel `other` value — rejected as redundant.

### Category is an attribute and a filter, not a grouping

The trip view keeps bag / With Me / unassigned as the only structural grouping; category appears as a badge and a filter chip. Rationale: two drag-and-drop hierarchies on a phone is the complexity the product principles warn against. Alternative considered: a "group by category" toggle — deferred; it can be layered on later without a data change.

### Category is copied onto trip entries, not read from the library

The copy functions set `category` on the inserted entry, mirroring `description`/`weight`. Rationale: consistent with the copy-on-add model, keeps trip edits independent of the library, and lets ad-hoc entries carry a category. Alternative considered: resolving category via `source_item_id` at read time — rejected because it breaks the copy model, hides library edits, and leaves ad-hoc entries unclassifiable.

### Weight-by-category covers the whole list

The breakdown sums every entry (bagged, With Me and unassigned), so it answers "what kind of things make up my list". It is presented as a distinct, clearly labelled card so it is not mistaken for the baggage total, which continues to exclude With Me and unassigned. Rationale: category is about kinds of things, and With Me items are still things carried. Alternative considered: baggage-only breakdown for arithmetic consistency — rejected because it hides the weight of exactly the items categories help reason about (documents, valuables).

### Chips surface only categories in use

The picker is grouped by heading for choosability, but the filter only offers categories present in the current list plus uncategorised. Rationale: 20 options never clutter a list that uses six. Alternative considered: showing all 20 as chips — rejected as noise.

### Extend `EntryLike` with `category`

Add `category: ItemCategory | null` to `EntryLike` so `filterEntriesByCategory` and `weightByCategory` can be generic over `TripEntry` and `SharedTripEntry`. Rationale: reuses the existing minimal-shape pattern and keeps the helpers testable without full rows. Alternative considered: a separate `CategoryLike` type — rejected as an extra type for one field.

### Bump the share payload version to `v: 2`

`get_shared_trip` returns `'v', 1`; add the category to the entry projection and bump to `2`. Rationale: signals a shape change to any future consumer. Nothing currently reads `v`, so the bump is safe. Alternative considered: leaving `v` at 1 — rejected as misleading once the shape changes.

## Risks / Trade-offs

- **Set drift between TS and SQL** → a unit test asserts `ITEM_CATEGORIES` matches the constraint's allowed values; the migration is the source of truth.
- **A new column silently missing from the share projection** → the explicit projection is deliberate; a test asserts `get_shared_trip` returns `category`, and a scenario covers uncategorised entries.
- **Category vs bag redundancy** (a "Toiletry bag" implies "Toiletries") → accepted; category is optional, so users who find it redundant can ignore it.
- **Weight breakdown read as the baggage total** → label the card explicitly as the whole list and keep it visually separate from the baggage total.
- **Duplicate-trip interaction** → no duplicate-trip feature exists yet; when one is added it must also copy `category`. Noted here so it is not missed.
- **In-flight change overlap** → `public-share-links` edits the same projection and shared view; land this change after it is archived or rebase on it.

## Migration Plan

1. Add nullable `category` with a check constraint to `packmate.reusable_items` and `packmate.trip_entries`. Existing rows stay `null`; no backfill, no RLS change.
2. `create or replace` both copy functions to carry `category`.
3. `create or replace` `get_shared_trip` to add `category` to the entry projection and bump `v` to 2.
4. Deploy the type, validation, data, packing and weight changes, then the library, trip and shared-view UI.
5. Rollback: the column is nullable and additive; dropping it restores prior behaviour with no data loss beyond categories.
