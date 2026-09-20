## 1. Port the missing theme components

- [x] 1.1 Add the dependencies the theme's data table requires (`@tanstack/react-table`, and `cmdk` for its column-filter command palette) to `package.json`; verify `npm install` succeeds and `npm run verify` still passes
- [x] 1.2 Port the theme's data-table family (`data-grid`, `data-grid-table`, `data-grid-column-header`, `data-grid-column-filter`, `data-grid-column-visibility`, `data-grid-pagination`, `data-grid-table-dnd`, `data-grid-table-dnd-rows`) into `components/ui/`; verify `npm run typecheck` and `npm run lint` pass
- [x] 1.3 Port the theme's `skeleton`, `tooltip`, `tabs` and `breadcrumb` components into `components/ui/`; verify `npm run typecheck` and `npm run lint` pass
- [x] 1.4 Render each ported component in isolation against sample Pack Mate data and verify it matches the reference appearance, with no missing icons or unstyled controls

## 2. Items and bags surfaces

- [x] 2.1 Rebuild the items surface on the data table with an image-or-category cell, name, category badge, weight, column sorting, column visibility and toolbar search; verify `app/(app)/items/page.test.tsx` passes
- [x] 2.2 Rebuild the bags surface on the data table with the weight limit as a labelled value, icon actions and toolbar search; verify `app/(app)/bags/page.test.tsx` passes
- [x] 2.3 Verify create, edit, delete and (for bags) default-contents management still work on both surfaces at mobile and desktop widths

## 3. Trips and shared links surfaces

- [x] 3.1 Rebuild the trips surface on the data table with a row that links to the trip, dates, icon actions and toolbar search; verify `app/(app)/trips/page.test.tsx` passes
- [x] 3.2 Rebuild the shared links surface on the data table with a status badge and icon actions for copy, regenerate and revoke; verify `app/(app)/shares/page.test.tsx` passes
- [x] 3.3 Verify create, edit and delete (trips) and copy, regenerate and revoke (shared links) still work at mobile and desktop widths

## 4. Trip packing list surface

- [x] 4.1 Present the trip summary (packing progress and baggage total) as one compact strip and verify the values shown match the list
- [x] 4.2 Present the packing list as borderless sections with an icon, name, packed count and weight per group, and dividers between entries rather than a bordered box per entry; verify `app/(app)/trip/page.test.tsx` passes
- [x] 4.3 Move list search and adding into a single action row, with adding opening a dialog covering a library item, a library bag and a one-off item; verify each add path creates the entry in the chosen destination
- [x] 4.4 Collapse the weight-by-category breakdown behind a disclosure and verify it stays hidden until opened
- [x] 4.5 Verify add-from-library, add one-off, assign-to-bag, With Me, packed toggle, quantity change, reorder and delete still work at mobile and desktop widths

## 5. Public shared trip surface

- [x] 5.1 Rebuild the shared trip page on the same components, read-only, with the progress and weight presentation and a route into the product; verify `components/share/shared-trip-view.test.tsx` passes
- [x] 5.2 Verify the shared page shows no editing controls and is reachable without signing in

## 6. Cross-cutting states and controls

- [x] 6.1 Replace every text-only loading placeholder on the surfaces with theme skeleton placeholders; verify no `Loading...` text remains on the surfaces
- [x] 6.2 Give every empty state an explanation and a way to create the first record; verify each surface's empty state renders with no records
- [x] 6.3 Give every record action an icon and an accessible name, and add tooltips to icon-only controls; verify each action is reachable by keyboard and announced by name
- [x] 6.4 Confirm the remaining native `<select>` controls (destination, parent-bag, category, expiry) use the theme's input styling and still change their values
- [x] 6.5 Verify every surface at mobile and desktop widths with no horizontal overflow and all navigation and actions reachable

## 7. Verification

- [x] 7.1 Verify `npm run verify` passes, including the bundle check and static export
- [x] 7.2 Update the end-to-end tests for the new surfaces and verify `npm run test:e2e` passes at mobile and desktop widths
- [x] 7.3 Confirm the paid template source remains untracked (`git ls-files reference/` is empty) and only derived code is committed
- [x] 7.4 Verify `openspec validate enrich-app-ui --strict` passes
