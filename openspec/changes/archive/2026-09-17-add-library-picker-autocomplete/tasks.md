## 1. Picker component

- [x] 1.1 Build a reusable, controlled picker (options, selected value, `onChange`) on the existing Popover primitive with a text input and a filtered list; verify a component test renders the trigger, opens the list and shows the options
- [x] 1.2 Implement filtering by reusing `filterByName` (case-insensitive substring, matching anywhere in the name); verify unit tests cover a mid-name match, a case-insensitive match and clearing the query
- [x] 1.3 Implement the keyboard contract: arrow keys move the active match, Enter confirms it, Escape dismisses without selecting, and typing resets the active match; verify component tests cover each
- [x] 1.4 Implement the no-match state, the empty-library state, and a capped number of rendered matches in a scrollable area; verify component tests show the no-match state for an unmatched query and the empty state for an empty library
- [x] 1.5 Show secondary detail (an item's category) alongside the name where available; verify a test shows two same-named entries as distinguishable

## 2. Adopt on the trip page

- [x] 2.1 Replace the "add a bag from your library" select with the picker, leaving the add-bag handler unchanged; verify selecting a library bag still copies the bag with its default contents (page test and manual check)
- [x] 2.2 Replace the "add an item from your library" select with the picker, leaving the add-item handler and the destination select unchanged; verify selecting a library item still adds it with its default quantity to the chosen destination
- [x] 2.3 Update `app/(app)/trip/page.test.tsx` for the new control; verify `app/(app)/trip/page.test.tsx` passes

## 3. Adopt on the bags page

- [x] 3.1 Replace the default-contents item select with the picker, leaving the add-content handler unchanged; verify adding an item to a bag's default contents still works with the chosen quantity
- [x] 3.2 Update `app/(app)/bags/page.test.tsx` for the new control; verify `app/(app)/bags/page.test.tsx` passes

## 4. Verification

- [x] 4.1 Add end-to-end coverage for selecting a library item and a library bag by typing at a mobile-width viewport; verify `npm run test:e2e` passes
- [x] 4.2 Verify `npm run verify` passes (typecheck, lint, formatting, unit tests, build and bundle check)
- [x] 4.3 Verify no dependency was added by confirming `git diff package.json` shows no change to dependencies
