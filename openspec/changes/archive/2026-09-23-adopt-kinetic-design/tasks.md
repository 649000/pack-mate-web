## 1. Design tokens and typefaces

- [x] 1.1 Replace the token base in `app/globals.css` with the light (Kinetic Utility) and dark (Kinetic Manifest) palettes and their semantic tokens (canvas, surface, well, border, text, primary, packed, with-me, pending, warning); verify `npm run build` succeeds
- [x] 1.2 Add the Stitch radius scale (4/8/12px, 6px checkbox, full pill), the three elevation levels and a tabular-numeral utility; verify `npm run typecheck` and `npm run lint` pass
- [x] 1.3 Load Plus Jakarta Sans, Inter and JetBrains Mono through `next/font` in `app/layout.tsx` and expose them as `--font-heading`, `--font-sans` and `--font-mono`; verify the fonts apply in both themes
- [x] 1.4 Remove the Metronic `demo1` and sidebar CSS from `app/globals.css`; verify no remaining reference to the removed classes

## 2. Application shell

- [x] 2.1 Build the desktop top nav (Dashboard, Trips, Bag Library, Items Library, Shared Links, search, create action, account/theme) in the Stitch language; verify navigation marks the current area
- [x] 2.2 Build the mobile app bar and bottom tab bar (Dashboard, Trips, Bags, Items) with account and shared links in the app bar menu; verify navigation is reachable at a mobile width
- [x] 2.3 Rewrite `components/layouts/app-shell.tsx` to compose the new navigation and remove the sidebar/layout-context chrome; verify every authenticated page renders inside the shell
- [x] 2.4 Restyle the header, footer and page header for both themes; verify no horizontal overflow at mobile and desktop widths

## 3. UI primitives

- [x] 3.1 Restyle the core primitives (button, card, badge, checkbox, progress, input, textarea, label, select, tabs, dialog, alert dialog, sheet, skeleton, tooltip, separator, sonner) to the Stitch tokens; verify each control in both themes
- [x] 3.2 Add the status chip treatments (packed, with-me, pending, warning) and apply them where items and bags show status
- [x] 3.3 Restyle the data table presentation to the Stitch tokens while keeping toolbar search, sorting and column visibility; verify `components/ui/data-grid.test.tsx` and the list surfaces still pass
- [x] 3.4 Give numeric values (counts, weights, percentages) the tabular/monospace numeric treatment

## 4. List surfaces

- [x] 4.1 Restyle the trips surface with destination, dates, packing progress and bag weight, keeping create, edit, duplicate and delete; verify `app/(app)/trips/page.test.tsx` passes
- [x] 4.2 Restyle the bags and items surfaces with the Stitch list/table treatment and status chips, keeping create, edit and delete; verify their page tests pass
- [x] 4.3 Restyle the shared links surface with the Stitch status treatment, keeping copy, regenerate and revoke; verify `app/(app)/shares/page.test.tsx` passes

## 5. Trip packing list

- [x] 5.1 Restyle the trip summary as a compact progress/weight strip in the Stitch language; verify the values match the list
- [x] 5.2 Restyle the packing list sections (bags, With Me, unassigned) with the Stitch row treatment, group icons and status chips, keeping reorder by drag; verify `app/(app)/trip/page.test.tsx` passes
- [x] 5.3 Present the packing list and its filters in the Stitch mobile treatment (status chips, touch-sized rows, sticky summary) while keeping all groups visible together and not hiding any group behind a tab
- [x] 5.4 Preserve add-from-library, add one-off, assign-to-bag, With Me, packed toggle, quantity change, reorder, delete, share, duplicate, weight-by-category and PDF export; verify each at mobile and desktop widths

## 6. Account, auth and share

- [x] 6.1 Restyle the account surface with the Stitch settings treatment, keeping every account action and the theme control
- [x] 6.2 Restyle the sign-in, reset and auth layout surfaces in the Stitch language, keeping Google and email flows and the MFA and linking paths; verify their page tests pass
- [x] 6.3 Restyle the public shared trip page read-only with a route into the product; verify `components/share/shared-trip-view.test.tsx` passes

## 7. Dashboard and error pages

- [x] 7.1 Add a read-only dashboard home that composes existing trip data (active trips, next journey, packing progress, weight against limits, upcoming trips) and routes into a trip; verify it makes no writes
- [x] 7.2 Make the dashboard the signed-in home and point sign-in and auth redirects at it
- [x] 7.3 Add not-found and error pages in the visual system with a route back to the app

## 8. Landing

- [x] 8.1 Rebuild the landing header and hero to the Stitch design, including the primary calls to action into sign-in
- [x] 8.2 Rebuild the supporting landing sections (product showcase, features, comparison, peace-of-mind steps, final call to action, footer) in the Stitch language, adapting copy to Pack Mate
- [x] 8.3 Remove the Metronic landing components and assets that are no longer referenced; verify the landing builds statically and remains public

## 9. Cleanup and verification

- [x] 9.1 Remove the deleted sidebar/layout files and any Metronic-only modules, and confirm nothing still imports them
- [x] 9.2 Update end-to-end tests for the new chrome and labels; verify `npm run test:e2e` passes at mobile and desktop widths
- [x] 9.3 Verify `npm run verify` passes, including typecheck, lint, formatting, unit tests with coverage, the build and the bundle check
- [x] 9.4 Confirm the Metronic reference and any template source remain untracked (`git ls-files reference/` is empty) and only derived code is committed
- [x] 9.5 Verify `openspec validate adopt-kinetic-design --strict` passes
