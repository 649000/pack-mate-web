## Context

Bags have a `name` and an optional `weight_limit_grams`, and are copied from the library into trips by database functions (`add_library_bag_to_trip`, `duplicate_trip`). Every surface renders the same Lucide `Luggage` icon. A bag's contents already carry categories, which can imply an icon when the user has not chosen one.

## Goals / Non-Goals

**Goals:**

- Let a user express a bag's identity with an icon, persisted and copied to trips.
- Keep the key set constrained and validated at both the application and database boundary.
- Give existing (icon-less) bags a meaningful derived icon without a backfill.

**Non-Goals:**

- Free-form or user-uploaded images for bags.
- Per-trip-only bag icons distinct from the library bag (trip bags are copies).
- Bag tags/filters beyond the icon (can build on the same key set later).

## Decisions

- **Semantic slug keys, not icon-library names.** Keys such as `suitcase`/`backpack` are stored; `lib/bag-icons.ts` maps them to Lucide components. The icon library can change without a data migration. Chosen over free-form strings (unvalidatable) and over a Postgres enum (adding a key would need a type migration either way, but a check constraint reads better and mirrors the existing `ITEM_CATEGORIES`/country pattern).
- **Nullable `icon text` plus a `check (icon is null or icon in (...))` constraint** on both `reusable_bags` and `trip_bags`. `lib/bag-icons.test.ts` asserts the app allowlist equals the constraint, the same guard used for countries and item categories.
- **Copy in the database functions**, not the client, so the icon travels with the bag exactly as the name and limit already do.
- **Derived fallback in `resolveBagIconKey`**: an explicit icon wins; otherwise the most common content category (deterministic tie-break by key order) maps to a key; otherwise `other`. Pure and unit-tested, applied only at render time — never persisted, so there is no denormalised data to drift.
- **Validation at the boundary**: `validateBagIcon` rejects unknown keys before the write, and the database constraint rejects a direct write.

## Risks / Trade-offs

- **Adding an icon key requires a migration** to extend the check constraint. Acceptable and consistent with the existing category/country constraints; rare in practice.
- **Derivation can guess wrong** for mixed bags. It is only a default and the user can override it; ties resolve deterministically rather than arbitrarily.
- **Icon choice is subjective**; the curated set keeps it consistent and a single map makes it easy to adjust.
