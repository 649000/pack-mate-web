## 1. Flag assets

- [x] 1.1 Add `flag-icons` as a dev dependency and a `scripts/vendor-flags.mjs` that copies the 4x3 SVGs for `lib/countries.ts` into `public/flags/<cc>.svg`
- [x] 1.2 Run the script and commit the vendored assets plus an attribution/licence note

## 2. Item category icons

- [x] 2.1 Add `lib/category-icons.ts` mapping every `ItemCategory` to a Lucide icon, plus a neutral placeholder for no category
- [x] 2.2 Add `components/packing/category-icon.tsx` (decorative, sized, `aria-hidden`)
- [x] 2.3 Use it in the item library table, packing-list rows and library pickers, alongside the category label
- [x] 2.4 Unit-test that every category has an icon and uncategorised items resolve to the placeholder

## 3. Country flags

- [x] 3.1 Add a flag-asset helper (`lib/country-flag.ts`, `countryFlagUrl(code)`), returning `null` for unknown codes
- [x] 3.2 Add `components/ui/country-flag.tsx` with a neutral fallback
- [x] 3.3 Show the flag on the trips list cards, trip header, dashboard next-trip card, destination info and the shared view
- [x] 3.4 Unit-test known codes resolve to a URL and unknown codes return `null`

## 4. Verification

- [x] 4.1 Add/adjust page tests for the affected surfaces (existing page tests pass; new unit tests added)
- [x] 4.2 Confirm mobile and desktop rendering, no broken images for unknown codes
- [x] 4.3 Run type-check, lint, format and unit tests
