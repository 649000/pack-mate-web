## Why

Every trip already has a required country and an optional destination, but the app does nothing useful with them beyond showing a label. Travellers need destination-specific facts to pack and prepare — which plug adapter, what currency, the calling code, how far ahead the clock is — and the packing list is the natural place to surface them. This is the first, static, offline-safe slice of that idea.

## What Changes

- Add a `destination_facts` reference table keyed by ISO 3166-1 alpha-2 country code, public-read via RLS, seeded by a versioned migration. It holds currency code, country calling code, plug type(s), voltage, frequency, and IANA timezones.
- Add a destination info panel on the trip page and the shared trip view showing plug types (with a small plug image), voltage and frequency, currency code and symbol, country calling code, and timezones with the difference from the viewer.
- Resolve timezones from the trip's destination text (city match against IANA zone names) when possible; otherwise show the country's zone list. Offsets are computed at the trip date, so daylight saving is correct.
- Derive the currency symbol and timezone offsets at runtime via `Intl` rather than storing them, so they cannot go stale.
- Ship plug images as static assets under `public/`.
- Keep the panel supplementary and fail-silent: it renders nothing while loading or when the data is unavailable, and never blocks or toasts over the packing list.
- Out of scope for this change: emergency numbers, weather, public holidays, and the PDF export.

## Capabilities

### New Capabilities

- `destination-facts`: reference data and display of country-level destination facts (plug/voltage/frequency, currency, calling code, timezones) on the trip page and shared trip view.

### Modified Capabilities

<!-- None. The panel is additive and does not change existing trip or sharing requirements. -->

## Impact

- New Supabase migration: `destination_facts` table, RLS public-read policy, and seed rows.
- New accessor in `lib/` plus a component under `components/packing/`.
- Rendered on the trip page and the shared trip view.
- New static assets under `public/`.
- No new runtime dependency and no third-party API call; currency symbols and timezone offsets come from the browser's `Intl`.
- No change to the existing trip or share data model.
