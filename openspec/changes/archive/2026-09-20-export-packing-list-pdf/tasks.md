## 1. Setup

- [x] 1.1 Add `@react-pdf/renderer` to `package.json` and verify `npm install` succeeds and `npm run typecheck` passes.

## 2. PDF view model

- [x] 2.1 Implement a pure builder that turns a trip, its bags and entries plus a `tickPacked` mode into a flat, render-ready view model (ordered bag tree, With Me group, unassigned group, each entry carrying name, quantity, category, weight and a ticked flag), reusing `buildBagTree`, `groupEntries` and `formatWeight`; verify with unit tests covering nesting, grouping, quantities and categories.
- [x] 2.2 Cover mode behaviour in unit tests: blank mode marks every entry unticked, match mode ticks exactly the entries where `is_packed` is true.
- [x] 2.3 Add per-bag weight and limit to the view model, including an over-limit flag; verify with unit tests for a bag under, at and over its limit and for a bag with no limit.
- [x] 2.4 Add the empty-trip case to the view model (no bags, no entries); verify a unit test asserts an empty state is produced rather than an error.
- [x] 2.5 Implement the filename helper `pack-mate-<trip-name>.pdf` with unsafe characters removed; verify with unit tests for spaces, slashes and long names.
- [x] 2.6 Verify the view model excludes descriptions, links and image URLs with a unit test asserting those fields are absent from the output.

## 3. PDF document

- [x] 3.1 Implement the `@react-pdf/renderer` document components (trip header, bag groups with nesting, entry rows with tick boxes, With Me and unassigned groups, weight and limit, empty state) consuming the view model, with a colocated PDF style block; verify `npm run typecheck` and a successful `npm run build`.
- [x] 3.2 Load the document and generator through a client-only dynamic import so they are code-split out of the trip page's initial bundle; verify the build succeeds and the trip page's first-load JS does not grow by the renderer's size.
- [x] 3.3 Implement the download step that turns the generated document into a Blob and triggers a `.pdf` download using the filename helper.

## 4. Trip page UI

- [x] 4.1 Add a "Download PDF" action beside Share in the trip page header that opens a small dialog with two modes, defaulting to blank; verify with a component test that blank is preselected and the mode can be changed.
- [x] 4.2 Wire the dialog to generation and download, showing a busy state and a failure toast; verify with a component test that confirming triggers generation with the selected mode.

## 5. End-to-end and quality

- [x] 5.1 Add an authenticated Playwright test that opens a trip, exports a blank PDF and asserts a `.pdf` download with the trip name in the filename; verify with `npm run test:e2e`.
- [x] 5.2 Add an e2e assertion that match mode reflects packed state by comparing the exported file against a trip with a packed entry.
- [x] 5.3 Check responsive behaviour of the new action and dialog at 390px and 1280px with no horizontal overflow; verify via the existing responsive e2e check.
- [x] 5.4 Run `npm run verify` and confirm typecheck, lint, formatting, unit tests with coverage, the build and the bundle check all pass.
