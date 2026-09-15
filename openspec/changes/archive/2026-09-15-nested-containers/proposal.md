## Why

Travellers nest containers: a packing cube or toiletry kit goes inside a suitcase, a daypack goes inside a larger bag. The current model is flat, so an item's location can only name one bag. "Where is it?" is often a path, not a single bag.

## What Changes

- Allow a trip bag to belong to another trip bag (at most one parent), so containers can nest.
- Show nested bags as a tree and show an entry's full location path (for example, `Suitcase > Toiletry kit`).
- Prevent cycles and cross-trip parents.
- Include nested bags in bag weight so a parent bag's total covers everything inside it, without double counting the trip total.
- Keep library bags flat; nesting is a trip-time arrangement.
- **BREAKING** (behavioral): a bag can no longer be assumed to sit at the top level; reordering becomes sibling-scoped.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `packing-lists`: trip bags can nest, display as a tree, and report a full location path; bag weight includes nested contents; bag reordering is scoped to siblings.

## Impact

- Database: `parent_bag_id` self-reference on `packmate.trip_bags` plus a trigger enforcing same-trip parents and acyclic nesting. RLS unchanged.
- Code: `lib/types.ts`, `lib/data.ts`, `lib/packing.ts` (tree + location path), `lib/weight.ts` (nested aggregation), `app/(app)/trip/page.tsx`.
- Depends on `find-items` (location label) and `item-weight-and-bag-limits` (weight aggregation) being in place.
- No new dependencies; no cost change.
