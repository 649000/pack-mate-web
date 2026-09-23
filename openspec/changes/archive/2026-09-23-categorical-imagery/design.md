## Context

Items have a nullable `category` (a fixed set of 20 values in `lib/validation.ts`) and trips have a `country_code`. Both are already rendered as text. Every record currently uses a single generic Lucide icon (`Package` for items, `Luggage` for bags). The app is used on both desktop and mobile, so imagery must render consistently across platforms and work offline.

## Goals / Non-Goals

**Goals:**

- Make items and trips scannable via category icons and country flags.
- Render consistently on desktop and mobile, offline, without a runtime third-party dependency.
- Derive everything from existing data; no schema or persisted state.
- Keep imagery accessible: decorative images, textual labels preserved.

**Non-Goals:**

- User-chosen per-record icons (bag icons are a separate change, `bag-identity`).
- Flags for sub-national regions.
- Animated, photographic or themed flags.
- Storing any icon or flag choice.

## Decisions

- **Category icons: a static `ItemCategory → LucideIcon` map plus a `<CategoryIcon>` component.** Lucide is already the icon set; a single map keeps choices consistent and testable ("every category has an icon"). Always rendered next to the visible category label.
- **Flags: vendor `flag-icons` (MIT) 4x3 SVGs into `public/flags/<cc>.svg`** for the countries in `lib/countries.ts`. A dev-only script (`scripts/vendor-flags.mjs`) copies them, so the source and licence are documented and reproducible; the assets are committed so builds are offline and deterministic. Per-file static assets are fetched on demand, so only rendered flags are downloaded.
  - Chosen over **emoji** (renders as letters on Windows — inconsistent on desktop) and over a **remote CDN** (offline/privacy/egress concerns). A **runtime npm dependency** was rejected because only static assets are needed.
- **`<CountryFlag code>` encapsulates rendering and fallback.** An unknown or absent code renders a neutral code chip, never a broken image. Swapping the rendering (e.g. to a sprite) later changes one file.
- **Accessibility:** icons and flags are `aria-hidden`; the category label and country name remain as accessible text. Flags are presented as decorative, not as the sole identifier.
- **Derivation lives in `lib/`** (`lib/category-icons.ts`, a `countryFlag`/flag-asset helper in `lib/countries.ts`) so it is pure and unit-testable, and so no surface reimplements the mapping.

## Risks / Trade-offs

- **Repo size** grows by the vendored flag SVGs. Mitigated by per-file loading (only rendered flags are fetched) and vendoring only the supported country list.
- **Vendor updates are manual** through the script; documented in the attribution file and the script.
- **Icon choice is subjective.** A single map keeps it consistent and trivial to adjust, and the "every category has an icon" test prevents gaps.
