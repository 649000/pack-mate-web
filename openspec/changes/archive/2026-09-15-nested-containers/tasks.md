## 1. Database

- [x] 1.1 Add `supabase/migrations/20260915020000_nested_containers.sql` adding nullable `parent_bag_id` to `packmate.trip_bags` with a self-referencing foreign key and `on delete cascade`; verify the migration applies cleanly to a local Supabase instance
- [x] 1.2 Add a `before insert or update` trigger on `packmate.trip_bags` that rejects a parent from another trip and rejects a parent that is the bag itself or one of its descendants; verify with direct SQL inserts that a cycle and a cross-trip parent are both rejected

## 2. Types and helpers

- [x] 2.1 Add `parent_bag_id` to `TripBag` in `lib/types.ts`; verify with `npm run typecheck`
- [x] 2.2 Add `setBagParent` (and a move-to-top-level path) to `lib/data.ts`, validating that the parent belongs to the same trip; verify via `lib/data.test.ts`
- [x] 2.3 Add `buildBagTree(bags)` to `lib/packing.ts` returning a nested structure and grouping entries under their bag; verify unit tests cover top-level, nested, and orphaned bags
- [x] 2.4 Replace the single-level location label with `entryLocationPath(entry, bags)` returning the chain of bag names, With Me, or unassigned; verify unit tests cover nested, top-level, With Me, and unassigned entries

## 3. Weight integration

- [x] 3.1 Update `sumBagWeight` and `tripBaggageTotal` in `lib/weight.ts` to include nested bags and sum only top-level bags for the trip total, propagating incompleteness; verify unit tests prove each entry is counted once

## 4. UI

- [x] 4.1 Render nested bags as an indented tree in `app/(app)/trip/page.tsx` with a control to move a bag into another bag or back to the top level; verify with `app/(app)/trip/page.test.tsx`
- [x] 4.2 Show the full location path in trip search results and on entry rows; verify with `app/(app)/trip/page.test.tsx`

## 5. Verification

- [x] 5.1 Extend `tests/integration/rls.test.ts` to assert that nesting is scoped to one trip, cycles are rejected, and a second user cannot read another user's nested bags
- [x] 5.2 Extend the authenticated e2e spec to nest a bag and find an entry whose result shows the full path
- [x] 5.3 Run `npm run verify` and confirm typecheck, lint, format, unit tests, build, and bundle checks pass
