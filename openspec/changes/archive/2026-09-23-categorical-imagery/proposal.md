## Why

Every record currently uses one generic icon. Items do not signal their category at a glance, and trips do not show the destination's flag, so lists are harder to scan quickly — especially on a phone. Both facts already exist in the data (`item.category`, `trip.country_code`), so improving scannability needs no new domain state.

## What Changes

- Show an **item category icon** for each item, alongside the category label, in the item library, packing-list rows and library pickers.
- Show the **destination country's flag** on trip surfaces: the trips list, a trip's header, the dashboard next-trip card, destination info and the public shared view.
- Render flags as **self-hosted SVG assets** (vendored, open licence) so they are consistent on desktop and mobile and work offline; an unknown or absent country code falls back to a neutral code chip, never a broken image.
- Icons and flags are **derived** from existing data — no schema change and no new persisted state.
- Add **no runtime dependency**: flag SVGs are vendored into `public/flags`.

## Capabilities

### New Capabilities

- `record-imagery`: how records (items and trips/destinations) are identified at a glance with category icons and country flags.

### Modified Capabilities

<!-- None: no existing requirement's behaviour changes; this introduces a new capability. -->

## Impact

- **Frontend**: `lib/category-icons.ts`, `lib/countries.ts`, `components/packing/category-icon.tsx`, `components/ui/country-flag.tsx`; items, trip, trips, dashboard, destination-info and shared surfaces.
- **Assets**: vendored `public/flags/*.svg` plus attribution.
- **Dependencies**: none at runtime; `flag-icons` (MIT) is a dev dependency used only to vendor the assets.
- **Tests**: unit tests for icon coverage and flag derivation/fallback; page tests for the affected surfaces.
