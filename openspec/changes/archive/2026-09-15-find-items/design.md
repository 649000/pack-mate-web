## Context

See `proposal.md` for motivation and `specs/items/spec.md` and `specs/packing-lists/spec.md` for the behavior contract.

Current state that shapes this design:

- The library (`packmate.reusable_items`) and trip copies (`packmate.trip_entries`) are separate tables. Adding a library item or bag to a trip copies rows via `packmate.add_library_item_to_trip` and `packmate.add_library_bag_to_trip` (`supabase/migrations/20260914000000_packing_list_foundation.sql:382` and `:329`).
- Trip entries already record a location: `trip_bag_id`, `is_with_me`, or neither. `lib/packing.ts` has `locationValue` / `groupEntries`.
- The trip view loads a trip's bags and entries into client state (`app/(app)/trip/page.tsx:238`), so it can filter and group locally.
- RLS keys ownership off the Firebase `sub` claim per row; no policy changes are needed for new columns.

## Goals / Non-Goals

**Goals:**

- Find a trip entry by name and show its location without a round trip.
- Carry optional description, link, and image URL through the library and the trip copy.
- Keep the copy-on-add boundary intact: editing a trip copy never writes to the library.

**Non-Goals:**

- Image upload or storage. Image is a URL only.
- Weight, worn, consumable, star.
- Nested containers (a separate change). The location label is designed to extend to a path later.
- Sharing, offline, "who has it".

## Decisions

### Add explicit nullable columns on both tables, not a JSONB blob

`description text`, `link text`, `image_url text` on `packmate.reusable_items` and `packmate.trip_entries`.

- Rationale: the three fields are known and typed; explicit columns allow DB check constraints, simple PostgREST selects, and TypeScript types that match.
- Alternative considered: a single `details jsonb` column. Rejected because it hides the shape, complicates validation, and makes copy-on-add a blind passthrough.

### Image by URL only

`image_url` stores an absolute http(s) URL. No Supabase Storage bucket.

- Rationale: zero new infrastructure, no egress on our side, no storage RLS, consistent with the AGENTS.md cost guidance.
- Alternative considered: Supabase Storage upload. Rejected for this change; revisit separately with a cost review, since public links would turn images into an egress vector.

### Search is a client-side filter

`searchEntries(entries, query)` filters the already-loaded entries by case-insensitive name substring.

- Rationale: the trip view already holds `entries` in state, so search is instant and needs no backend change. Consumer trips are small (tens to low hundreds of entries).
- Alternative considered: a server-side `ilike` query. Rejected as unnecessary latency and complexity for the current data size; can be revisited if trip sizes grow.

### Location label as a pure, path-ready helper

Add `entryLocationLabel(entry, bags)` to `lib/packing.ts` returning the bag name, `With Me`, or an unassigned label.

- Rationale: keeps display logic testable and out of the component, and gives nesting a single place to change into a path (`Bag > Sub-bag`).
- Alternative considered: inline the label in the component. Rejected; harder to test and would need rework for nesting.

### Validate at the boundary, constrain in the database

`validateOptionalUrl` and `validateOptionalDescription` in `lib/validation.ts`, mirrored by DB checks (`link`/`image_url` null or `~* '^https?://'`, description length cap).

- Rationale: the app gives a clear error; the database guarantees integrity even if a write bypasses the app.
- Alternative considered: app-only validation. Rejected because the database is the last line of defense.

### Render description as text; render images with a plain `img`

- Rationale: prevents XSS from description content, and arbitrary user-supplied image hosts make `next/image` remote patterns impractical.
- Links and image URLs are restricted to http(s), so no `javascript:` or `data:` URIs.

## Risks / Trade-offs

- **Copy path drift** — a new column that the RPCs forget to copy would silently break the copy-on-add guarantee → update both RPCs and cover with an integration test that adds an item with details and asserts the trip entry carries them.
- **External images break or hotlink** — a user's image URL may rot → render with an `alt` fallback and treat the thumbnail as best-effort, never blocking the row.
- **Search/description scope creep** — search matches name only in this change → the spec pins this; description matching can be a later, separate decision.
- **Regex divergence** — the DB check and app validation could disagree on what a valid URL is → keep the app validation authoritative for user messaging and test both layers.
- **Over-long descriptions** — capped in both layers to avoid unbounded rows → a single shared maximum constant.

## Migration Plan

1. Add nullable columns to `reusable_items` and `trip_entries` with check constraints. No backfill; existing rows are valid.
2. `create or replace` both copy functions to select and insert the new columns.
3. Deploy app changes (types, data access, validation, UI).
4. Rollback: drop the new columns and restore the previous function definitions; no data loss beyond the new optional fields.

## Open Questions

- Thumbnail sizing and aspect handling on small screens can be tuned during implementation without affecting the specs or approach.
