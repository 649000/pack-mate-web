## Context

See `proposal.md` - Why. Two things shape the approach:

- The app is a static export (`next.config.ts` sets `output: "export"`), and `app/(app)/trip/page.tsx` already shows that any `useSearchParams` use must sit under a `Suspense` boundary or the build fails.
- Every list is already fetched whole and filtered in the client: `listTrips`, `listItems` and `listBags` are plain `select *` queries scoped by RLS, and the items page filters by category in the browser. There is no server-side text search and no full-text index.
- A stub search dialog already exists at `components/layouts/topbar/search-dialog.tsx`; it filters three hardcoded destinations.

## Goals / Non-Goals

**Goals:**

- Real search over trips, library items and library bags from the existing topbar dialog.
- A filter box on each of the three list pages, driven by the same matching rules.
- One shared matching implementation, so the dialog and the pages cannot diverge.

**Non-Goals:**

- Server-side or indexed search (Postgres FTS, `pg_trgm`, `ilike` queries).
- Searching item descriptions, links or categories, or fuzzy/typo tolerance.
- Cross-trip lookup of trip entries or trip bags; the existing within-trip entry search is unchanged.
- Deep-linking straight into an item/bag editor dialog.
- Persisting or sharing search state beyond the URL handoff.

## Decisions

### Match client-side over the already-loaded lists

Filter in the browser with a case-insensitive substring match, reusing the semantics of `searchEntries` in `lib/packing.ts`. A generic name-matcher can be shared by the dialog and the pages.

Alternatives considered: per-table `ilike` queries (network per keystroke, more failure states, no benefit at current data sizes) and Postgres full-text search (new index, migration and query surface for a feature that only needs substring matching). Both are rejected as over-engineering against the project's cost and simplicity principles.

### The query lives in the URL as a handoff, not as live state

The dialog navigates to `/trips?q=...`, `/items?q=...` or `/bags?q=...`. The list page seeds its search box from `q` and then keeps the query in local state; it does not rewrite the URL on every keystroke.

Rationale: the URL is what makes one mechanism serve both doors, but rewriting the route parameter per character adds router churn and re-renders for no user-visible gain. Back/refresh losing a transient filter is acceptable.

Alternative considered: two-way URL sync so filters are shareable and bookmarkable. Deferred as unnecessary for this feature; it can be added later without changing the specs.

### Extend the existing dialog rather than add a route

The dialog already owns the search affordance in the topbar. It fetches the three lists when opened (not on every keystroke) and groups matches under Trips, Items and Bags. An empty query keeps the current destination list.

### Filtered list, not direct open

Selecting a result lands on the filtered list. Items and bags have no standalone page (they edit in inline dialogs), so "open the result" would mean three different mechanisms; the filtered list is one consistent behaviour, and `/trip?id=` already covers opening a specific trip.

## Risks / Trade-offs

- **Three extra reads each time the dialog opens** -> Fetch once per open, on the client, and keep the dialog's matching in memory; data is small and RLS-scoped, so the cost is negligible and there are no listeners or polling.
- **Dialog and page rules drifting apart** -> Share one name-matching helper; both call it.
- **Static export build failure from `useSearchParams`** -> Follow the `Suspense` pattern already used in `app/(app)/trip/page.tsx`.
- **Overlap with the in-progress `adopt-metronic-ui` change**, which owns the app shell and currently owns `search-dialog.tsx` -> Sequence this work after that change lands, or fold the dialog wiring into it, so the same file is not edited from two directions.
- **Users expect description/category matches on items** -> Documented as a non-goal; matching stays name-only so results are predictable, and it can be widened later without a spec change to existing requirements.

## Migration Plan

No data, schema or configuration changes. Deploy is the normal CI pipeline. Rollback is reverting the frontend change; the URL parameter is additive and harmless if left unread.
