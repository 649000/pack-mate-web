## Why

Packed state is toggled one entry at a time. At the end of packing, or when resetting a trip to reuse it in place, clearing or setting many ticks by hand is tedious. A traveller should be able to pack or reset a whole trip in one action.

## What Changes

- Add a trip-level **Pack all** action and an **Unpack all** (reset) action in the trip's progress card.
- A bulk action always applies to the **whole trip**, not only the entries currently shown by the search, category or packed filters, and its label states the count it affects.
- After a bulk action, offer a transient **Undo** that restores each affected entry's previous packed state exactly, including a mix of packed and unpacked entries.
- Bulk packing never changes quantity, weight, category, location, or progress beyond the packed count.
- No persistent undo history and no cross-device conflict handling; undo is per-action and expires with the toast.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `packing-lists`: add bulk pack/unpack of a trip's entries, scoped to the whole trip, with undo.

## Impact

- Database: new `set_trip_packed` function (security invoker) that sets packed state for a trip's entries in one statement.
- Code: `lib/data.ts`, `app/(app)/trip/page.tsx` (progress card controls and undo toast).
- Tests: unit for the snapshot/inverse logic, RLS integration (a second user cannot bulk-change another user's trip), and the authenticated e2e flow.
- No new dependencies; no cost change.
