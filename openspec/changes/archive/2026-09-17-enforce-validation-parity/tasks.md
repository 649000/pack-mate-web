## 1. Shared validator

- [x] 1.1 Add `MAX_NAME_LENGTH = 200` to `lib/validation.ts` and reject names longer than it in `validateName` (after trimming); verify with boundary unit tests in `lib/validation.test.ts` (200 accepted, 201 rejected, surrounding whitespace trimmed) run via `npm test`
- [x] 1.2 Confirm existing callers of `validateName` (items, bags, trips, trip entries) surface the new error through their existing error handling; verify by running `npm test`

## 2. Database constraints

- [x] 2.1 Add a migration adding a name-length check constraint (`length(btrim(name)) between 1 and 200`) to `packmate.reusable_items`, `reusable_bags`, `trips`, `trip_bags` and `trip_entries`; verify with `npm run supabase:reset` that the migration applies cleanly
- [x] 2.2 In the same migration, replace the non-negative weight check constraints on `reusable_items.weight_grams`, `trip_entries.weight_grams`, `reusable_bags.weight_limit_grams` and `trip_bags.weight_limit_grams` with constraints that also reject values above 100000; verify with `npm run supabase:reset`

## 3. Integration tests

- [x] 3.1 Add integration coverage in `tests/integration/schema.test.ts` asserting the database rejects a 201-character name on each of the five name columns and accepts a 200-character name; verify with `npm run supabase:start && npm run test:integration`
- [x] 3.2 Add integration coverage asserting the database rejects a weight and a weight limit above 100000 g and accepts the 100000 g boundary; verify with `npm run test:integration`

## 4. Verification

- [x] 4.1 Run `npm run verify` and `npm run test:integration` and confirm typecheck, lint, format, unit tests, build, bundle check and integration tests all pass
