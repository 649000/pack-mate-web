## Context

The app holds everything a suggestion engine needs: `destination_facts` (plug types, voltage), trip dates, `trip_entries` and `reusable_items` (names and categories). There is no engine today. The product wants a light, always-available helper now and a smarter (AI) one later.

## Goals / Non-Goals

**Goals:**

- A pure, deterministic rules engine that suggests possibly-missing items.
- One async seam and a provider interface so an AI provider can be added later without touching the UI.
- Persisted, per-user dismissals.
- No new runtime dependency and no AI cost.

**Non-Goals:**

- Shipping an AI provider in this change.
- Suggesting on every keystroke or streaming suggestions.
- Cross-trip or global recommendations.
- A model-training or feedback pipeline.

## Decisions

- **`getTripSuggestions(context): Promise<Suggestion[]>` is async from day one**, even though the rules are synchronous. The UI always awaits, so adding an async AI provider later needs no UI change. This is the central future-proofing decision.
- **`Suggestion` carries provenance** (`source`, `confidence`, `reason`) so rules and AI results can coexist, be ranked and shown with a reason.
- **`SuggestionContext` is assembled by the caller** from data the app already holds, keeping providers pure and testable and independent of Supabase.
- **Rules are the baseline; additional providers are additive.** Providers run in parallel; results are merged and de-duplicated by normalised name; a provider failure is swallowed so rules always render. A future AI provider is config-gated, off by default, and cached by `destination + normalised list signature` (documented here so the cost trap is deliberate when it is implemented).
- **Dismissals are stored in Postgres** (`suggestion_dismissals`, owner-only RLS, unique per user/trip/key) rather than client storage, so they follow the user across desktop and mobile. "Add" also suppresses a suggestion because the item then exists on the trip.
- **Rules stay conservative** to avoid nagging: each rule first checks the trip's entries and the library, and only fires when nothing matches.

## Risks / Trade-offs

- **Rule quality is a judgement call.** Rules are few and conservative, with a persisted dismiss for anything unwanted.
- **Derived suggestions add a small amount of compute per trip load.** The rules are O(entries); negligible.
- **A future AI provider introduces egress cost.** Mitigated by the gate, the rules baseline and caching; called out here so it is a conscious decision later.
- **Dismissal keys must be stable.** Keys are rule-scoped and content-based (`rule:adapter:C,F`), so they remain stable across renders and are safe to persist.
