## Why

Pack Mate has no specification or implementation yet, and two decisions constrain everything that follows: the domain model (how reusable bags/items relate to a trip's packing list) and the access architecture (how the browser reaches the database). Getting these wrong is expensive to reverse, so they are fixed first.

## What Changes

- Define the domain model: a reusable **library** of items and bags, **trips**, and trip-scoped copies of bags and items.
- Establish **copy-on-add** semantics: adding a reusable bag or item to a trip copies it into trip-scoped rows. Later edits to the library do not modify existing packing lists.
- Define the three item locations on a trip: **in a bag**, **With Me**, or **loose** (unassigned). Bag membership and With Me are mutually exclusive.
- Support **quantity** per item and **drag-to-reorder** within a trip.
- Define the access architecture: Firebase Auth for identity, Supabase Postgres + PostgREST + RLS for data, a statically exported Next.js frontend calling PostgREST directly.
- Standardise terminology on **"With Me"** (replaces "On Me").
- No custom backend for the MVP; Supabase RLS is the authorization boundary.

## Capabilities

### New Capabilities

- `authentication`: sign-in/out, session, and protected access via Firebase Auth.
- `items`: reusable item library — create, edit, delete, default quantity.
- `bags`: reusable bag library — create, edit, delete, and default contents (items + quantity).
- `trips`: create, edit, and delete trips; a trip owns its packing list.
- `packing-lists`: assemble a trip's list by adding bags and items, mark items With Me, mark packed, and view progress.

### Modified Capabilities

<!-- None. No existing specs. -->

## Impact

- **New database schema** in Supabase Postgres, with RLS policies on every table (authorization boundary).
- **New Next.js frontend**, statically exported and served from Firebase Hosting; client-rendered behind auth, with a public landing page.
- **Firebase Auth** integration, including the Supabase third-party auth bridge (Firebase ID token -> `auth.uid()`).
- **New dependencies**: `firebase`, `@supabase/supabase-js`.
- **Terminology change**: standardised on "With Me"; AGENTS.md reconciled (was "On Me").
- No backend code is introduced in this change. A server may be added later only if a requirement (e.g. payments) demands it.
