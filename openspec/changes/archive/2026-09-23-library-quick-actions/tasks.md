## 1. Data

- [x] 1.1 Add a `duplicate_bag` database function (atomic, owner-checked) that copies the bag and its default contents and suffixes the name within the length limit
- [x] 1.2 Point `duplicateBag` in `lib/data.ts` at the function and unit-test the call and error path

## 2. Add to trip

- [x] 2.1 Add a shared `components/add-to-trip-dialog.tsx` (trip picker, empty-trips state)
- [x] 2.2 Add an Add to trip action to each Item Library row, loading the trip list
- [x] 2.3 Add an Add to trip action to each Bag Library card, loading the trip list

## 3. Duplicate bag

- [x] 3.1 Add a Duplicate action to bag cards

## 4. Verification

- [x] 4.1 Page tests for adding to a trip (items and bags) and duplicating a bag
- [x] 4.2 Integration test that `duplicate_bag` copies contents, suffixes the name within the limit, leaves the source untouched, and rejects another user
- [x] 4.3 Run type-check, lint, format and unit tests