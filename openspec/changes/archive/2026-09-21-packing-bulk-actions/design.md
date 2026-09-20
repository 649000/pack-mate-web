## Context

See `proposal.md` for motivation and `specs/packing-lists/spec.md` for the behavior contract.

Relevant current state:

- Packed state lives on each trip entry as `is_packed` (`supabase/migrations/20260914000000_packing_list_foundation.sql:70`) and is toggled one entry at a time through `updateEntry` (`lib/data.ts:324`).
- Progress is derived with `packingProgress(entries)` (`lib/packing.ts:4`) and shown in the trip's progress card (`app/(app)/trip/page.tsx:782`).
- The trip view already holds the full `entries` array in client state, and applies search, category and packed filters to the rendered subset only.
- Ownership is enforced by RLS and by `security invoker` functions that assert the caller owns the trip (`:344`).

## Goals / Non-Goals

**Goals:**

- Pack or reset a whole trip in one action.
- Provide an exact, cheap undo for the action.
- Keep the action's scope unambiguous next to the existing filters.

**Non-Goals:**

- Per-bag or per-group bulk actions.
- A persistent undo history or a general undo stack.
- Cross-device conflict resolution.
- Applying bulk actions to a filtered subset.

## Decisions

### One `security invoker` function `set_trip_packed(p_trip_id, p_packed)`

The function asserts the caller owns the trip and updates every entry's `is_packed` in a single statement.

- Rationale: one atomic statement is cheaper than N client updates and cannot partially apply.
- Alternative considered: N parallel `updateEntry` calls. Rejected: many round trips and possible partial failure.

### Undo from a client snapshot, not server history

Before the action the client snapshots `entries.map((e) => ({ id: e.id, is_packed: e.is_packed }))`; undo restores those exact values with the inverse update.

- Rationale: `is_packed` is a boolean with no side effects, and the client already holds the full list, so the previous state is free. No history table is needed.
- Alternative considered: a server-side history table. Rejected as heavy for a trivial, reversible boolean.

### Undo restores the snapshot, not a uniform value

Undo writes back the recorded per-entry values rather than flipping everything to `false`.

- Rationale: if some entries were already packed before "Pack all", a uniform reset would wrongly unpack them.
- Alternative considered: toggle all back. Rejected: loses pre-existing packed entries.

### Scope is always the whole trip

The controls live in the progress card, away from the search/category/packed filter chips, and their label states the count they affect (for example, "Pack all 24 items").

- Rationale: a bulk control next to filters reads as "apply to what is shown", which would be surprising. Placement and an explicit count remove the ambiguity.
- Alternative considered: apply to the filtered subset. Rejected as ambiguous and rarely intended.

### Transient undo with a toast

The undo is offered through the existing toast mechanism for a short window and then expires; no state is retained after that.

- Rationale: matches how transient undo is expected to behave and keeps the feature small.
- Alternative considered: persistent undo. Rejected as unnecessary complexity.

## Risks / Trade-offs

- **Concurrent edits on another device** → undo may clobber a tick made in the window; acceptable for a personal app, and undo is only offered briefly.
- **Empty trip** → the action affects zero entries and shows no misleading count.
- **Misreading scope near filters** → controls sit in the progress card with an explicit count, not beside the filter chips.
- **Expired undo** → the change simply stands; the spec makes this explicit.

## Migration Plan

1. Add a migration creating `packmate.set_trip_packed(uuid, boolean)` and granting execute to `authenticated`.
2. Add `setTripPacked` to `lib/data.ts`.
3. Add the Pack all / Unpack all controls and the undo toast to the trip page.
4. Rollback: drop the function; the UI controls are removed with the deploy.

## Open Questions

- Whether to also add per-bag pack actions later is deferred and would be a separate change.
