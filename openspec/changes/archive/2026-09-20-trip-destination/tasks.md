## 1. Country data and validation

- [x] 1.1 Create `lib/countries.ts` with the static `{ code, name }` ISO 3166-1 alpha-2 list plus a code-to-name lookup; verify a unit test confirms every code is unique, two uppercase letters, and has a non-empty name
- [x] 1.2 Add destination/country validation to `lib/validation.ts` (country must be a known code; destination optional, trimmed, max 200); verify unit tests cover a known code, an unknown code, an empty destination and an over-long destination

## 2. Database migration

- [x] 2.1 Add a migration adding `destination` (nullable, trimmed 1..200 when set) and `country_code` (`not null`, ISO alpha-2 with a known-list check) to `packmate.trips`; verify an integration test accepts a valid row and rejects a null country, an unknown code and an over-long destination written directly
- [x] 2.2 Update `packmate.get_shared_trip` to select and include `destination` and `country_code`, and bump the payload `v` from 1 to 2; verify an integration test asserts the shared payload exposes both fields at `v: 2`

## 3. Data layer

- [x] 3.1 Add `destination` and `country_code` to `Trip` and carry them through `createTrip`/`updateTrip` in `lib/data.ts`; verify `npm run typecheck` passes and trip unit tests cover create and edit with and without a destination
- [x] 3.2 Add the two fields to `SharedTrip` in `lib/types.ts`; verify the shared-trip data test passes against the `v: 2` payload

## 4. Trips UI

- [x] 4.1 Add a required country picker and an optional destination input to the create/edit dialog in `app/(app)/trips/page.tsx`; verify a component test blocks submit without a country and saves a valid destination and country
- [x] 4.2 Show the destination and the country **name** (never the code) in the trips list; verify a component test renders the name and asserts the raw code is absent

## 5. Trip header

- [x] 5.1 Show the destination and country name in the trip header in `app/(app)/trip/page.tsx`; verify a component test renders the country name and omits the code

## 6. Sharing

- [x] 6.1 Show the destination and country name in the shared view; verify the shared-trip view test renders the country name and asserts the code is not shown

## 7. PDF export

- [x] 7.1 Add the destination and country name to the PDF trip line in `lib/pdf.ts`, coordinating with the in-flight `export-packing-list-pdf` change; verify a `lib/pdf` unit test covers the line with and without a destination

## 8. Verification

- [x] 8.1 Run `npm run lint`, `npm run typecheck`, `npm run test:coverage` and `npm run test:integration` and confirm all pass
- [x] 8.2 Run `openspec validate trip-destination --strict` and confirm the change is valid
