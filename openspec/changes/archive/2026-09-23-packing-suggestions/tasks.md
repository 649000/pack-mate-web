## 1. Database

- [x] 1.1 Add `suggestion_dismissals` (`user_id`, `trip_id`, `suggestion_key`, `source`, `dismissed_at`, unique per user/trip/key) with owner-only RLS and a grant to `authenticated`
- [x] 1.2 Add `listSuggestionDismissals` and `dismissSuggestion` to `lib/data.ts`

## 2. Suggestion engine

- [x] 2.1 Add `lib/suggestions/types.ts` (`Suggestion`, `SuggestionContext`, `SuggestionProvider`)
- [x] 2.2 Add `lib/suggestions/rules.ts` with the adapter, clothing-gap and essentials rules
- [x] 2.3 Add `lib/suggestions/index.ts` exposing the async seam and merging/de-duplicating providers
- [x] 2.4 Unit-test the rules, de-duplication and provider fallback with a fake provider

## 3. UI

- [x] 3.1 Add `components/packing/suggested-items.tsx` (add from library / create / dismiss)
- [x] 3.2 Show it on the trip screen
- [x] 3.3 Add component tests for adding and dismissing a suggestion
- [x] 3.4 Add the compact top tip on the dashboard (limited to the first suggestion)

## 4. Verification

- [x] 4.1 Integration-test that a second user cannot read or write another user's dismissals (written; see 4.3)
- [x] 4.2 Run type-check, lint, format and unit tests
- [x] 4.3 Apply the migration to the linked database (`supabase db push`)
- [ ] 4.4 Run the integration tests against the local Supabase stack (requires Docker)
