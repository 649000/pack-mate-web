## Context

See `proposal.md` for motivation and `specs/packing-lists/spec.md` for the behavior contract.

Relevant current state:

- `packmate.trip_bags` is flat: `trip_id`, `name`, `source_bag_id`, `position` (`supabase/migrations/20260914000000_packing_list_foundation.sql:61`).
- The trip view loads all trip bags and entries into client state and groups entries by bag (`app/(app)/trip/page.tsx:238`).
- RLS on `trip_bags` scopes rows by trip ownership (`:216`); a parent pointer does not change that.
- `find-items` adds a single-level location label; `item-weight-and-bag-limits` adds weight aggregation. This change builds on both.

## Goals / Non-Goals

**Goals:**

- Model real container nesting on a trip and render it clearly on mobile.
- Make location a path and keep weight correct across nesting.
- Keep nesting integrity in the database, not only in the app.

**Non-Goals:**

- Nested library bags. The library stays flat.
- Multi-parent or graph-shaped containers. One parent only.
- Unlimited nesting depth as a product goal; the UI may indent or collapse.

## Decisions

### Self-referencing `parent_bag_id` on `trip_bags`

`parent_bag_id uuid references packmate.trip_bags (id) on delete cascade`, nullable.

- Rationale: single-parent nesting is a tree, which a self-reference models directly and cheaply.
- Alternative considered: a separate containment join table. Rejected as unnecessary for a single parent.

### Library bags stay flat

- Rationale: nesting is an arrangement made for a specific trip, not a reusable property of a container.
- Alternative considered: nest library bags too. Rejected for complexity in the library and copy model.

### Enforce integrity with a database trigger

A `before insert or update` trigger rejects a parent that belongs to a different trip and rejects a parent that is the bag itself or one of its descendants.

- Rationale: a `CHECK` constraint cannot traverse rows, so the database cannot otherwise guarantee acyclicity or same-trip parents. This keeps the invariant even if a write bypasses the app.
- Alternative considered: app-only validation. Rejected as weaker integrity.

### Build the tree in the app from loaded rows

A `buildBagTree(bags)` helper returns a nested structure for rendering; entries group under their bag.

- Rationale: the trip view already loads all bags, so no recursive query is needed, and the tree is easy to test.
- Alternative considered: a recursive CTE ordered by path. Deferred; unnecessary at current scale.

### Location becomes a path

`entryLocationPath(entry, bags)` returns the chain of bag names from outermost to innermost, rendered as `A > B`.

- Rationale: it answers "where" precisely once bags nest.
- Alternative considered: keep the single innermost bag name. Rejected because it hides which outer bag to open.

### Weight aggregates nested contents without double counting

A bag's weight is its own entries plus its nested bags' weights. The trip total sums top-level bags only. Incompleteness propagates upward.

- Rationale: avoids counting a nested entry both in the child and in the total.
- Alternative considered: sum all bags. Rejected because it double counts.

## Risks / Trade-offs

- **Cycles** — a bad parent pointer could loop the tree → trigger rejects self/descendant parents; tree builder also guards against unexpected cycles.
- **Cross-trip parents** — could leak structure across trips → trigger requires the parent to share the trip; RLS still scopes reads.
- **Double counting in totals** — the most likely arithmetic bug → the "top-level only" rule is in the spec and covered by tests.
- **Mobile depth** — deep indentation crowds small screens → cap visual indent and collapse deep levels.
- **Ordering dependency** — this change assumes `find-items` and `item-weight-and-bag-limits` are archived first → note the dependency and update their helpers rather than duplicating.

## Migration Plan

1. Add `parent_bag_id` and the integrity trigger to `packmate.trip_bags`. Existing rows default to top level, so no backfill.
2. Deploy the tree builder, location path, and updated weight aggregation.
3. Update the trip view to render the tree and move bags.
4. Rollback: drop the trigger and the column; the app falls back to the flat grouping.

## Open Questions

- The practical maximum nesting depth to support in the UI can be tuned during implementation without changing the specs or approach.
