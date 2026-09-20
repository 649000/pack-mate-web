## Context

See `proposal.md` — Why. Constraints that shape the approach:

- The app is a static export (`next.config.ts`: `output: "export"`), so there is no server route to proxy or cache data. Supabase PostgREST is the only backend.
- The shared trip view is a server component that already reads from Supabase, and it must work for anonymous visitors.
- Trips store a validated ISO 3166-1 alpha-2 `country_code` and an optional free-text `destination`; there is no subdivision or coordinates field.
- `lib/countries.ts` already defines the known-country set in code and is mirrored by a database check constraint on `trips.country_code`.
- The project avoids third-party runtime dependencies and cost traps, and keeps the frontend independent of backend details.

## Goals / Non-Goals

**Goals:**

- Provide country-level destination facts as read-only reference data with a clear update path.
- Keep the panel purely supplementary: it never blocks or degrades the packing list.
- Derive everything that can drift (currency symbol, time-zone offsets) rather than storing it.
- Keep the data source authoritative and the client free of third-party API calls.

**Non-Goals:**

- Emergency numbers, weather, public holidays and PDF export.
- Sub-national accuracy beyond first-level time-zone cities; no geocoding of free-text destinations.
- Any user-editable destination data, or any change to the trip/share data model.

## Decisions

### Store facts in Supabase, not a bundled table

Add a `destination_facts` table keyed by `country_code`, with a public-read RLS policy and no write policies. Seeded by a versioned migration.

- **Why over a bundled `lib/*.ts` table** (the `countries.ts` pattern): the data drifts independently of the app (currency changes, plug standards), so updating it must not require a code deploy; it keeps one data layer instead of a code table plus a database; and it keeps the data out of every user's bundle.
- **Alternative considered**: a generated committed TS table — rejected for the deploy coupling, despite its offline and zero-infrastructure advantages.
- **Note**: `lib/countries.ts` stays in code because it is a database check constraint, not because reference data belongs in code.

### Source from standards, generated into a seed migration

Generate the seed rows from authoritative sources and commit the generated migration:

| Field | Source |
| --- | --- |
| Currency code | ISO 4217 / Unicode CLDR territory→currency |
| Calling code | ITU-T E.164 (e.g. libphonenumber metadata) |
| Time zones | IANA tz database (`zone.tab`) |
| Plug / voltage / frequency | IEC World Plugs (IEC 60083, IEC 60038) |

- **Why**: the consolidated country APIs/packages are community-maintained and cover neither electricity nor emergency numbers; standards bodies are authoritative per domain.
- **Emergency numbers are excluded**: there is no authoritative global machine-readable source, and an unverified safety-critical number is worse than none.
- A dev-only generator script produces the migration; the generated diff is reviewable in the PR.

### Derive currency symbol and time-zone offsets at runtime

Store `currency_code` and IANA `timezones`; derive the symbol with `Intl.NumberFormat` and offsets with `Intl.DateTimeFormat` in the viewer's zone.

- **Why**: symbols and offsets change with locale and daylight saving; deriving them cannot go stale and needs no stored data.
- Offsets are computed for the trip's `start_date` when set, otherwise the current date, matching the spec.

### Resolve time zones by city match, else list the country's zones

Match the trip's `destination` text against the city name embedded in each IANA zone id (e.g. `America/Los_Angeles` → "Los Angeles"), scoped to the trip's country. On a match, show that zone; otherwise show all of the country's zones, each labelled by city.

- **Why**: no geocoding, no network, no new trip field, and no silently-wrong representative zone. `destination` is free text, so a match is best-effort and the list is the honest fallback.
- **Alternative rejected**: a representative/capital zone — the US capital is Eastern, so it is 3–6 hours wrong for most US trips.
- **Alternative deferred**: geocoding the destination to coordinates — more accurate but introduces a network dependency and free-text failure modes; revisit alongside weather.
- **Curation**: the stored `timezones` are the country's primary zones; zones belonging to a separately listed territory (e.g. PR, GU) are excluded.

### Keep the panel fail-silent and non-blocking

The component renders `null` while loading, on error, and when no facts exist — mirroring `TripCountdown`, which returns `null` when it has nothing to show. It never toasts and never gates the rest of the page.

- **Why**: it is supplementary; the packing list must be fully usable without it.

### Plug images as static assets

Ship plug images under `public/`, keyed by plug type letter.

- **Why**: images are not reference data; Supabase Storage would add egress cost for no benefit.

## Risks / Trade-offs

- [Data drift: currency changes, new plug standards] → seed from standards; add a test asserting every known country has a row and that codes are well-formed; refresh via a new migration.
- [City match false positives] → match against known zone city names only, scoped to the trip's country, and fall back to the full list.
- [Multi-zone countries without a match show a list] → acceptable and honest; the list is city-labelled and offsets are shown.
- [Extra Supabase read per trip and shared view] → small and cacheable per `country + year`-style key; fail-silent means it cannot harm the page.
- [RLS misconfiguration exposing writes] → add an integration test that a second user and an anonymous client cannot insert, update or delete facts, following the existing RLS test pattern.
- [Emergency numbers omitted] → documented non-goal; revisit only with a verifiable source.

## Migration Plan

1. Add the `destination_facts` table, the public-read policy, and the generated seed rows in one versioned migration; CI applies it behind the protected `production` environment before the app deploy.
2. Deploy the app, which reads the table.
3. Rollback: drop the table; the change is additive and no existing data depends on it.

## Open Questions

- Whether corrections should go through a reviewed migration or be editable via the Supabase dashboard without a deploy.
- The exact upstream dataset for electricity (IEC World Plugs has no machine-readable feed); may need hand-curation — pin during implementation.
- Whether to later replace the `trips.country_code` check constraint with a foreign key to a `countries` table (separate refactor).
