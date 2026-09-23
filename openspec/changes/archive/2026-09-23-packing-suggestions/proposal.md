## Why

Packing anxiety is mostly about forgetting something important. The app can already see the destination's facts, the trip length and the current list, but never uses them to help. A small, deterministic suggestion engine turns that data into "you may be missing X" prompts, without adding configuration or cost. The engine is designed so a smarter (AI) provider can be added later behind the same interface.

## What Changes

- Add a **suggestion engine** that derives candidate items from data the app already holds: destination facts, trip dates, the current entries and the library.
- Ship a **rules provider** with three conservative rules: a missing plug adapter for the destination, a clothing gap on multi-day trips, and core "With Me" essentials.
- Expose a single **async seam** (`getTripSuggestions`) and a `SuggestionProvider` interface so a future provider (Firebase AI Logic) can be added additively; rules remain the baseline and a failing/disabled provider falls back to rules.
- Let a user **add** a suggested item (from the library or as a new item) or **dismiss** it; dismissals are **persisted per user and trip** so they stay dismissed.
- Present suggestions as a compact block on a trip and a top tip on the dashboard.

## Capabilities

### New Capabilities

- `packing-suggestions`: how the app proposes possibly-missing items for a trip and remembers dismissals.

### Modified Capabilities

<!-- None. -->

## Impact

- **Database**: new `suggestion_dismissals` table with owner-only RLS.
- **Domain**: new `lib/suggestions/` module (types, rules, composition); `lib/data.ts` dismissal accessors.
- **UI**: `components/packing/suggested-items.tsx` on a trip; a tip on the dashboard.
- **Tests**: unit tests for rules, dedupe and composition (with a fake provider); integration tests for dismissal RLS; page tests.
- **Cost**: no AI calls in this change; a future AI provider must be config-gated, additive and cached.
