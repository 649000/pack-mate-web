## Context

Library items and bags are added to a trip only from the trip's Add dialog. Trip duplication exists (`duplicate_trip`, `lib/trip-duplicate.ts`), but bags have no equivalent. The library surfaces already render per-row actions via `RecordAction`.

## Goals / Non-Goals

**Goals:**

- Add a library item or bag to a trip in one action from the library.
- Duplicate a bag, including its default contents.

**Non-Goals:**

- Choosing a destination bag or "With Me" during the add (the item is added unassigned; the trip screen moves it).
- Duplicating items or trips changes.
- A server-side atomic duplicate for bags.

## Decisions

- **One shared `AddToTripDialog`** used by both the items and bags pages: it lists the user's trips and calls back with the chosen trip id, so the two pages share one interaction instead of two bespoke dialogs.
- **Add unassigned**, reusing the existing `add_library_item_to_trip` / `add_library_bag_to_trip` RPCs (which copy default quantity/contents and already enforce ownership). Placing the item afterwards is the trip screen's job.
- **A `duplicate_bag` database function** copies the bag and its default contents in one transaction (`security invoker`, owner-checked), mirroring `duplicate_trip`. The copy's name is suffixed `(copy)` and trimmed to the 200-character limit inside the function, so a direct write cannot exceed it and a partial copy cannot occur. `lib/data.ts` calls the function and returns the created bag.

## Risks / Trade-offs

- **Adding unassigned** means a second step to place the item; kept deliberately simple to avoid a heavier picker.
- **A new function/migration** is required (and applied by CI); the payoff is an atomic, RLS-safe duplicate with no client-side partial-copy window.
