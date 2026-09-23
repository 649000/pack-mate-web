## 1. Database and domain

- [x] 1.1 Add a constrained `theme` column (`light`/`dark`, default `light`) to `profiles`
- [x] 1.2 Add `ProfileTheme` to `lib/types.ts` and `validateTheme` to `lib/validation.ts`
- [x] 1.3 Add `updateProfileTheme` to `lib/data.ts` (targeted upsert) and unit-test it

## 2. UI

- [x] 2.1 Add a `ThemeSync` component that applies the stored theme when the profile loads
- [x] 2.2 Persist the choice from the account menu toggle
- [x] 2.3 Mount `ThemeSync` once in the root layout for signed-in users

## 3. Verification

- [x] 3.1 Run type-check, lint, format and unit tests
- [x] 3.2 Apply the migration to the linked database (`supabase db push`)
- [ ] 3.3 Run the migration and integration tests against the local Supabase stack (requires Docker)
