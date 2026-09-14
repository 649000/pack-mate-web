## 1. Foundations

- [x] 1.1 Add `firebase` and `@supabase/supabase-js` dependencies; verify `npm install` succeeds and `npm run build` and `npm run lint` still pass
- [x] 1.2 Configure Next.js static export (`output: 'export'`); verify `npm run build` emits a static `out/` directory
- [x] 1.3 Add client config for Firebase and Supabase public keys (anon/publishable only); verify no secrets or service keys are committed or bundled

## 2. Database schema and RLS

- [x] 2.1 Create tables `reusable_items`, `reusable_bags`, `reusable_bag_items`, `trips`, `trip_bags`, `trip_entries` with constraints (required names, mutually exclusive `trip_bag_id`/`is_with_me`); verify the migration applies cleanly
- [ ] 2.2 Enable RLS on every table and add owner policies pinned to the Firebase JWT subject claim (`auth.jwt() ->> 'sub'`) for SELECT/INSERT/UPDATE/DELETE with `WITH CHECK`; verify a second user cannot read or write another user's rows
- [ ] 2.3 Add child-table policies that verify parent ownership (`trip_bags` -> `trips`, `trip_entries` -> `trips`, `reusable_bag_items` -> `reusable_bags`); verify cross-user access is denied
- [ ] 2.4 Implement Postgres function(s) for copy-on-add (adding a bag copies the bag and its default contents; adding an item copies with default quantity); verify a library edit does not alter existing trip rows

## 3. Authentication

- [ ] 3.1 Integrate Firebase Auth sign-in and sign-out; verify an unauthenticated user cannot reach app routes and a signed-in user can
- [ ] 3.2 Configure Supabase Firebase third-party auth (`project_id` scoping) and the client `accessToken` callback; verify `auth.uid()` resolves and own-row queries succeed
- [ ] 3.3 Verify cross-user access end to end: an authenticated user cannot read another user's trips, bags, items, or packing list

## 4. Data access layer

- [x] 4.1 Implement typed data-access functions for items, bags, trips, and packing list entries; verify explicit types and no `any`
- [x] 4.2 Add input validation at the boundary; verify invalid input (e.g. empty name, negative quantity) is rejected

## 5. Item library UI

- [ ] 5.1 Implement list, create, edit, and delete for reusable items with default quantity; verify each operation against the `items` spec, including the empty state
- [ ] 5.2 Verify editing or deleting a library item leaves existing packing lists unchanged

## 6. Bag library UI

- [ ] 6.1 Implement list, create, edit, and delete for reusable bags; verify the empty state
- [ ] 6.2 Implement managing a bag's default contents (add/remove items with quantity); verify contents persist and are copied on add to a trip

## 7. Trip management UI

- [ ] 7.1 Implement list, create, edit, and delete for trips; verify the empty state and that deleting a trip removes its packing list

## 8. Packing list UI

- [ ] 8.1 Implement adding bags and items to a trip; verify copies are created with the correct quantities
- [ ] 8.2 Implement assigning entries to a bag, With Me, or loose with mutual exclusion; verify the constraint holds in the UI and database
- [ ] 8.3 Implement editing entry quantity; verify the new quantity is shown and persisted
- [ ] 8.4 Implement drag-to-reorder for bags and entries; verify order persists after reload
- [ ] 8.5 Implement the packed toggle and packing progress; verify state is per-trip, progress updates, and the empty state shows 0 of 0

## 9. Hosting and deploy

- [x] 9.1 Configure Firebase Hosting for the static export with deep-linkable trip routes (SPA-fallback rewrite); verify a direct load of a trip URL works
- [ ] 9.2 Deploy and verify the landing page is public while app routes require authentication

## 10. Cross-cutting verification

- [ ] 10.1 Verify all screens on mobile and desktop widths
- [ ] 10.2 Verify error and empty states for every screen
- [x] 10.3 Verify the client bundle contains no secrets and only public keys
