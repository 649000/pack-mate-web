## Context

See `proposal.md` — Why. Two constraints shape this design:

- The project is greenfield: a Next.js 16 / React 19 / Tailwind v4 scaffold with no data layer, no auth, and no specs.
- The product is single-user, mostly CRUD, with no collaboration or multi-tenancy.

The domain tension to resolve is that reusable bags/items must be reusable across trips, while edits to the library must not mutate existing packing lists.

## Goals / Non-Goals

**Goals:**

- One clear model for reusable resources, trips, and trip-scoped copies.
- Authorization enforced at a single boundary, with no custom backend code for the MVP.
- A frontend that is independent of backend implementation details at the call site.

**Non-Goals:**

- No collaboration, sharing, or multi-tenancy.
- No offline support, sync engine, or complex client state.
- No custom server or API layer in this change.
- No AI features (deferred).

## Decisions

### Copy-on-add, not live reference

Trip bags and trip entries are copied from the library at the moment they are added, with an optional nullable `source_*_id` link kept for provenance.

- **Why:** the brief requires that library edits do not modify existing packing lists. Reference semantics would violate that (renaming or deleting a library item would rewrite or orphan trip data).
- **Alternative — live reference:** single source of truth, corrections propagate, but past trips mutate and library deletes need orphan handling. Rejected.
- **Alternative — reference + per-trip override:** supports both behaviors, but adds a resolution layer for little MVP value. Rejected.
- **Cost:** library corrections do not propagate to existing trips. A future "update this trip from library" action can address this explicitly.

### Browser calls PostgREST directly; RLS is the authorization boundary

The frontend uses `@supabase/supabase-js` with the public anon key and calls Supabase PostgREST directly. There is no Functions layer and no Next.js API routes.

- **Why:** the app is mostly CRUD; PostgREST generates the API, RLS enforces ownership, and the browser never holds privileged credentials. This removes the serverless-to-Postgres connection problem and all cold-start latency.
- **Alternative — Firebase Functions:** requires writing CRUD, token verification, and connection pooling for no functional gain. Rejected for MVP; revisit only when a server is genuinely required (e.g. payments webhooks).
- **Alternative — Next.js server routes:** rejected by the project owner.
- **Consequence:** authorization lives in SQL (RLS policies), which must be treated as first-class, tested artifacts.

### Firebase Auth bridged into Supabase

Identity is Firebase Auth. Supabase is configured with Firebase as a third-party auth provider (`[auth.third_party.firebase]` with `project_id` scoping), and the Supabase client supplies the Firebase ID token via an `accessToken` callback.

Firebase uids are strings, not UUIDs, so `auth.uid()` (which casts the subject claim to `uuid`) cannot be used. `user_id` is therefore `text`, and RLS matches ownership against the JWT subject claim, `auth.jwt() ->> 'sub'`.

Firebase ID tokens carry no `role` claim, so Supabase would evaluate them as `anon`. A Firebase Auth blocking function (`beforeUserCreated` / `beforeUserSignedIn`) stamps `role: "authenticated"` on every sign-up and sign-in. This is the one Firebase Function the project needs.

- **Why:** keeps identity on Firebase (already chosen for hosting and future AI) while letting PostgREST/RLS enforce ownership without custom token verification.
- **Risk:** Supabase trusts an external issuer, so `project_id` scoping and strict RLS are required to prevent tokens from unrelated Firebase projects being accepted.

### Static export, client-rendered

The app is built with `output: 'export'` and served from Firebase Hosting. The authenticated app is client-rendered; only the landing/marketing page is public and pre-rendered at build time.

- **Why:** everything behind auth needs no SSR or SEO. Static hosting removes the Firebase Hosting/SSR conflict entirely.
- **Consequence:** dynamic routes (`/trips/[id]`) cannot be pre-generated for user data. Mitigate with a Firebase Hosting SPA-fallback rewrite, or a single authenticated app shell with client-side view state.

### Location is two mutually exclusive columns

A trip entry's location is expressed as `trip_bag_id` (in a bag) or `is_with_me` (With Me), with neither meaning loose. A check constraint enforces mutual exclusion.

- **Why:** three locations, one of which is a container reference, are simplest as two nullable/boolean columns with a constraint, rather than a polymorphic location table.

### Schema sketch

```
reusable_items       id, user_id, name, default_qty
reusable_bags        id, user_id, name
reusable_bag_items   bag_id, item_id, qty, position
trips                id, user_id, name, start_date, end_date
trip_bags            id, trip_id, name, source_bag_id?, position
trip_entries         id, trip_id, trip_bag_id?, name, qty,
                     source_item_id?, is_with_me, is_packed, position
```

All tables live in a dedicated `packmate` schema (not `public`), which is exposed to the API. The client is configured with `db.schema = 'packmate'`. All tables carry `user_id text` directly or inherit ownership through a parent for RLS. Ownership is matched against `auth.jwt() ->> 'sub'`. Ordering uses an integer `position`, reindexed on reorder.

### Terminology: "With Me"

The user-facing and spec term is "With Me". It matches the user's mental model ("I'll keep my passport with me") and avoids the body-contact literalism of "On Me". AGENTS.md has been reconciled from "On Me".

## Risks / Trade-offs

- **RLS misconfiguration leaks data** → RLS enabled on every table; every policy pinned to `auth.uid()`; `WITH CHECK` on writes; child tables verify parent ownership; authorization tests per table.
- **Library corrections do not propagate** → accepted trade-off; future explicit "update from library" action.
- **Static export + dynamic routes friction** → choose a SPA-fallback rewrite or single app shell during implementation.
- **Third-party auth trust boundary** → `project_id` scoping plus strict RLS; verify App Check support separately.
- **Two vendors to operate** → accepted; Firebase owns identity/hosting/AI, Supabase owns relational storage.

## Migration Plan

Greenfield — no data migration. Deploy order: Supabase schema + RLS → Firebase project + Auth → frontend static build → Firebase Hosting. Rollback is redeploy of the previous static build plus schema revert via migrations.

## Open Questions

- Does Supabase's Firebase third-party auth integration honour Firebase App Check? Verify before relying on it.
- Which static-export routing approach to use for dynamic trip routes (SPA fallback vs single app shell)?
