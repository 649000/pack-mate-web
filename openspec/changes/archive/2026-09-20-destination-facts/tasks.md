## 1. Reference data and migration

- [x] 1.1 Add a versioned migration in `supabase/migrations/` creating `packmate.destination_facts` (country_code primary key, currency_code, calling_code, plug_types text[], voltage, frequency, timezones text[], updated_at) with a check that `country_code` matches the known-country set; verify it applies with `npm run supabase:reset`
- [x] 1.2 Add RLS on `destination_facts` with a public-read policy and no insert/update/delete policies; verify with `npm run supabase:start && npm run test:integration` that reads succeed for `anon` and `authenticated`
- [x] 1.3 Add a dev-only generator script that produces the seed rows from ISO 4217/CLDR (currency), ITU-T E.164 (calling code), IANA `zone.tab` (timezones) and IEC World Plugs (plug/voltage/frequency), and commit the generated seed migration
- [x] 1.4 Add a unit test asserting every country in `lib/countries.ts` has a seeded row and that plug letters, currency codes, calling codes and IANA zone ids are well-formed
- [x] 1.5 Add an integration test that a second user and an anonymous client cannot insert, update or delete a `destination_facts` row; verify it fails without the policy and passes with it

## 2. Data access and domain types

- [x] 2.1 Add a `DestinationFacts` type to `lib/types.ts` matching the table shape and verify `npm run typecheck` passes
- [x] 2.2 Add `getDestinationFacts(countryCode)` to `lib/data.ts` returning the row or `null`; verify with a unit test covering a known code and an unknown code
- [x] 2.3 Confirm the shared view's data path can read facts for an anonymous visitor; verify with an integration test reading `destination_facts` through the anon client

## 3. Timezone resolution and formatting

- [x] 3.1 Add `lib/destination-facts.ts` with a pure resolver: match the trip destination text against IANA zone city names scoped to the country, else return all of the country's zones; verify with unit tests for a city match, no match, and a single-zone country
- [x] 3.2 Add offset computation via `Intl.DateTimeFormat` for a given zone at the trip's start date (or the current date when absent) and a formatted difference from the viewer; verify with unit tests including a date that crosses a daylight-saving change
- [x] 3.3 Add a pure currency-symbol helper deriving the symbol from the currency code via `Intl.NumberFormat`; verify with unit tests for a known code and an unknown code
- [x] 3.4 Add a city-label helper turning an IANA zone id into a display city (e.g. `America/Los_Angeles` -> "Los Angeles"); verify with unit tests

## 4. Plug assets

- [x] 4.1 Add one small image per plug type under `public/plugs/`, matching the letters stored in `plug_types`; verify every letter used in the seed has an asset and each asset renders in the browser
- [x] 4.2 Confirm the plug asset licensing permits redistribution and record the source in a comment or adjacent note

## 5. Destination info component

- [x] 5.1 Add `components/packing/destination-info.tsx` showing plug type(s) with images, voltage, frequency, currency code and symbol, calling code, and time zones with the viewer difference; verify with component tests covering a multi-plug, multi-zone country
- [x] 5.2 Make the component fail-silent: render `null` while loading, on error, and when no facts exist, without a toast; verify with component tests for the loading, error and empty cases
- [x] 5.3 Check responsive behaviour at mobile and desktop widths; verify there is no horizontal overflow and the panel is readable on a small screen

## 6. Surfaces

- [x] 6.1 Render `DestinationInfo` on the trip page (`app/(app)/trip/page.tsx`); verify with a page test that facts show for a trip with a country and that a facts fetch failure leaves the packing list usable
- [x] 6.2 Render `DestinationInfo` on the shared trip view for anonymous visitors; verify with a shared-view test that facts show and that a facts failure does not break the shared list

## 7. Verification

- [x] 7.1 Run `npm run verify` (typecheck, lint, format check, unit tests, build, bundle check) and confirm it passes
- [x] 7.2 Run `npm run supabase:start && npm run test:integration` and confirm the new RLS and schema tests pass
- [x] 7.3 Manually confirm the panel on a trip with a single-zone country, a multi-zone country with a city match, and a multi-zone country without a match
